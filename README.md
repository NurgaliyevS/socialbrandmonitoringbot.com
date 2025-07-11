# Social Brand Monitoring Bot

A Node.js application that monitors Reddit comments for specific keywords and provides real-time social listening capabilities.

## Features

- 🔍 **Real-time Monitoring**: Monitors Reddit comments every minute
- 🎯 **Keyword Matching**: Detects mentions of specified keywords with word boundary matching
- 📊 **Comprehensive Logging**: Detailed logging with Winston
- ⚙️ **Configurable**: Easy configuration via environment variables
- 🐳 **Docker Ready**: Includes Dockerfile for containerized deployment

## Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd socialbrandmonitoringbot.com
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Keywords to monitor (comma-separated)
   KEYWORDS=AI,artificial intelligence,machine learning,chatgpt,openai
   
   # Logging configuration
   LOG_LEVEL=info
   
   # Monitoring configuration
   COMMENT_LIMIT=100
   ```

## Usage

### Development
```bash
npm start
```

### Production with Docker
```bash
# Build the Docker image
docker build -t social-brand-monitor .

# Run the container
docker run -d --name social-monitor social-brand-monitor
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KEYWORDS` | Comma-separated keywords to monitor | `AI,artificial intelligence,machine learning` |
| `LOG_LEVEL` | Logging level | `info` |
| `COMMENT_LIMIT` | Number of comments to fetch per request | `100` |

### Optional Configuration

For enhanced functionality, you can add:

- **Reddit API Authentication**: For higher rate limits
- **Database Integration**: To store monitoring results
- **Notification System**: Telegram, email, or webhook notifications

## How It Works

1. **Data Collection**: Fetches recent comments from r/all using Reddit's public API
2. **Keyword Analysis**: Analyzes comment content for specified keywords
3. **Logging**: Records all activities and matches in log files
4. **Scheduling**: Runs every minute using node-cron

## Logs

The application creates two log files:
- `logs/combined.log`: All log entries
- `logs/error.log`: Error-level entries only

## API Endpoints

The application uses Reddit's public JSON API:
- Endpoint: `https://www.reddit.com/r/all/comments.json`
- Rate Limit: Respects Reddit's rate limiting
- Authentication: Not required for basic usage

## Monitoring Output

When keywords are found, the application logs:
- Comment author
- Subreddit
- Matched keyword
- Comment URL
- Timestamp

## Troubleshooting

### Common Issues

1. **Logs directory not found**
   - The application automatically creates the `logs` directory
   - Ensure write permissions in the application directory

2. **Rate limiting**
   - Reddit may rate limit requests if too frequent
   - Consider using authenticated API for higher limits

3. **No matching comments**
   - Check your keyword configuration
   - Verify keywords are spelled correctly
   - Consider using broader terms

## Development

### Project Structure
```
src/
├── index.js          # Main application file
├── utils/            # Utility functions (future)
└── services/         # Service modules (future)
```

### Adding Features

1. **Database Integration**: Add database connection and storage logic
2. **Notifications**: Implement webhook or messaging service integration
3. **Advanced Filtering**: Add subreddit filtering or sentiment analysis
4. **Analytics**: Add metrics collection and reporting

## License

[Your License Here]

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
