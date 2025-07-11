require("dotenv").config();
const cron = require("node-cron");
const winston = require("winston");
const fs = require("fs").promises;
const path = require("path");

// Ensure logs directory exists
async function ensureLogsDirectory() {
  try {
    await fs.mkdir("logs", { recursive: true });
  } catch (error) {
    console.error("Error creating logs directory:", error);
  }
}

// Configure logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.simple(),
  })
);

function checkKeywordMatch(content, keywords) {
  const lowerContent = content.toLowerCase();
  
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    
    // Use word boundaries to avoid false matches (e.g., "AI" in "again")
    const regex = new RegExp(`\\b${lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    
    if (regex.test(lowerContent)) {
      return keyword;
    }
  }
  
  return null;
}

async function fetchNewComments(limit) {
  try {
    // Use fetch to make a direct request without authentication
    const response = await fetch(
      `https://www.reddit.com/r/all/comments.json?limit=${limit}&raw_json=1`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      logger.error(`Reddit API returned status ${response.status}: ${response.statusText}`);
      logger.error(`Response headers:`, Object.fromEntries(response.headers.entries()));
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !data.data.children) {
      logger.error("Response structure:", JSON.stringify(data, null, 2));
      throw new Error("Invalid response format from Reddit API");
    }

    logger.info(`Fetched ${data.data.children.length} comments`);

    return data.data.children.map((commentData) => {
      const comment = commentData.data;
      return {
        id: comment.id,
        author: comment.author || "deleted",
        subreddit: comment.subreddit,
        body: comment.body,
        url: comment.url,
        permalink: comment.permalink,
        score: comment.score,
        created: new Date(comment.created_utc * 1000),
        parentId: comment.parent_id,
        linkId: comment.link_id,
        isPost: false,
        // Additional fields available from the API
        gilded: comment.gilded,
        edited: comment.edited,
        stickied: comment.stickied,
        distinguished: comment.distinguished,
        controversiality: comment.controversiality,
        depth: comment.depth,
      };
    });
  } catch (error) {
    logger.error("Error fetching all new comments:", error);
    throw error;
  }
}

async function processComments(comments) {
  // Example keywords to monitor - you can customize these
  const keywords = process.env.KEYWORDS ? process.env.KEYWORDS.split(',') : ['AI', 'artificial intelligence', 'machine learning'];
  
  const matchingComments = [];
  
  for (const comment of comments) {
    const matchedKeyword = checkKeywordMatch(comment.body, keywords);
    if (matchedKeyword) {
      matchingComments.push({
        ...comment,
        matchedKeyword
      });
      logger.info(`Keyword match found: "${matchedKeyword}" in comment by ${comment.author} in r/${comment.subreddit}`);
    }
  }
  
  return matchingComments;
}

// Main processing function
async function runMonitoring() {
  try {
    logger.info("Started monitoring process");
    
    const comments = await fetchNewComments(100);
    const matchingComments = await processComments(comments);
    
    if (matchingComments.length > 0) {
      logger.info(`Found ${matchingComments.length} comments matching keywords`);
      // Here you could add logic to send notifications, save to database, etc.
    } else {
      logger.info("No matching comments found");
    }
    
    logger.info("Completed monitoring process");
  } catch (error) {
    logger.error("Error in monitoring process:", error);
    
    // If we get a 403 or 429, wait longer before next attempt
    if (error.message.includes('403') || error.message.includes('429')) {
      logger.warn("Rate limited or blocked by Reddit. Waiting 5 minutes before next attempt.");
      // Don't exit, just log the error and continue
    }
  }
}

// Initialize logs directory and start monitoring
async function initialize() {
  await ensureLogsDirectory();
  
  // Run initial monitoring
  await runMonitoring();
  
  // Schedule monitoring every minute
  cron.schedule("* * * * *", runMonitoring);
  
  logger.info("Social Brand Monitoring Bot - Running every minute");
}

// Start the application
initialize().catch(error => {
  logger.error("Failed to initialize application:", error);
  process.exit(1);
});
