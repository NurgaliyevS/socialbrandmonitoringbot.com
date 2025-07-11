require("dotenv").config();
const Snoowrap = require("snoowrap");
const OpenAI = require("openai");
const cron = require("node-cron");
const winston = require("winston");
const fs = require("fs").promises;
const path = require("path");

// Initialize Reddit client
const reddit = new Snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT,
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD,
});

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


export function checkKeywordMatch(content, keywords) {
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
      `https://www.reddit.com/r/all/comments.json?limit=100&raw_json=1`,
      {
        headers: {
          "User-Agent": "RedditSocialListening/1.0.0",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.data || !data.data.children) {
      console.error("Response structure:", JSON.stringify(data, null, 2));
      throw new Error("Invalid response format from Reddit API");
    }

    console.log(data.data.children.length, "data.data.children.length");

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
    console.error("Error fetching all new comments:", error);
    throw error;
  }
}

// every minute
cron.schedule("* * * * *", async () => {
  logger.info("Started process");

  fetchNewComments(100)

  logger.info("Completed activity");
});

// Initial run - removed to prevent immediate execution
logger.info("Social Brand Monitoring Bot - Will run every minute");
