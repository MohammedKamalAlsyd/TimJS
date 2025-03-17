# TimJS

TimJS is a browser extension designed to help you understand and optimize your online behavior. By tracking your browsing time, analyzing your interactions on YouTube, and visualizing your website navigation patterns, TimJS provides valuable insights to improve productivity and time management.

## Features

### Browsing Time Tracking
- **Time Spent:** Records the duration of your visits to different websites.
- **Website Categorization:** Classifies websites into categories such as Social Media, Technology, Shopping, etc.
- **Productivity Metrics:** Calculates "wasted time" on leisure websites (e.g., Social Media, Entertainment) and "working time" on productive websites (e.g., Technology, Education).
- **Aggregation Options:** View your data aggregated by day, week, or month.

### YouTube Interaction Analysis
- **Content Tracking:** Monitors time spent on YouTube videos and shorts.
- **Genre Classification:** Categorizes YouTube content by genre for deeper insights (requires content scraping to be enabled).
- **Scraping Control:** Option to enable or disable YouTube content scraping via the dashboard.

### Website Navigation Patterns
- **Network Graph:** Visualizes transitions between websites as a network graph, with options for directed or undirected views.
- **Pattern Analysis:** Uses chi-square tests to identify significant navigation patterns, such as whether one website is frequently visited after another.

### Data Visualization
- **Charts and Graphs:**
  - Bar charts for time spent per website category.
  - Radial bar charts for YouTube video and shorts interactions by genre.
  - Network graphs for website navigation patterns.
- **Summary Statistics:** Displays total browsing time, aggregated browsing time, total URLs opened, and more.

### User Interface
- **Dashboard:** A comprehensive view of all your browsing statistics, including time breakdowns and website details.
- **Popup Summary:** Quick access to today’s browsing time with a button to navigate to the full dashboard.
- **Time Period Selection:** Switch between daily, weekly, or monthly data views using the aggregation options.

### Data Management
- **Local Storage:** All data is stored locally using chrome.storage for privacy.
- **Data Retention:** Automatically deletes data older than 30 days to manage storage efficiently.

## Getting Started

### Installation:
- **For Users:** Install the extension from the Chrome Web Store (link to be added once published).
- **For Developers:** Clone the repository and load the extension manually in your browser:
  1. Open Chrome and navigate to `chrome://extensions/`.
  2. Enable "Developer mode" in the top right.
  3. Click "Load unpacked" and select the TimJS project folder.

### Usage:
- Click the TimJS icon in your browser toolbar to open the popup.
- View a summary of today’s browsing time.
- Click "Go to Dashboard" to access detailed statistics and visualizations.
- Use the aggregation options (day, week, month) to view data for different time periods.

### Configuration:
- In the Interaction Analysis section of the dashboard, toggle YouTube content scraping on or off to enable/disable genre tracking.

## Development

This project is built using Extension.js for ease of development and scalability. Below are the available scripts for development, testing, and deployment:

### Available Scripts:
- `npm dev`: Runs the extension in development mode. Launches a new browser instance with the extension loaded, automatically reloading on code changes for a smooth development experience.
- `npm start`: Runs the extension in production mode. Launches a new browser instance with the extension loaded, simulating the production environment.
- `npm build`: Builds the extension for production, optimizing and bundling it for deployment to the Chrome Web Store or manual distribution.

## Privacy

TimJS prioritizes user privacy:
- All tracking data is stored locally on your device using chrome.storage.
- No data is sent to external servers.
- You can manage or delete your data through the extension’s interface (data older than 30 days is automatically removed).

## Limitations

- **Social Media Analysis:** Currently limited to YouTube; other platforms like Facebook or Twitter are not yet supported.
- **Pattern Analysis:** Focuses on website navigation transitions; broader A/B testing for time management strategies is not implemented.
- **Time Management Tools:** Visualizations are available, but features like setting time limits or blocking websites are not yet included.
- **Personalization:** User profiles and tailored recommendations are not implemented in the current version.

## Future Plans
- Expand interaction analysis to include other social media platforms (e.g., Facebook, Twitter).
- Implement time management features such as website blocking or customizable time limits.
- Add user profiles and personalized recommendations based on browsing habits.
- Enhance data visualizations with more interactive and customizable options.

## Contributing

Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with your changes, ensuring they follow the project’s coding standards and include appropriate tests.

## License

This project is licensed under the MIT License.
