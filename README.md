# Captive Portal

This project implements a captive portal that provides users with a login interface to access the network. Below is an overview of the project structure and its components.

## Project Structure

```
captive-portal
├── src
│   ├── assets
│   │   ├── css
│   │   │   └── styles.css        # CSS styles for the captive portal
│   │   └── js
│   │       └── main.js           # JavaScript for client-side functionality
│   ├── index.html                 # Main landing page for users
│   ├── login.html                 # Login interface for user credentials
│   └── success.html               # Page displayed after successful login
├── server
│   ├── app.js                     # Entry point for the server-side application
│   ├── routes
│   │   └── auth.js                # Authentication routes for handling login
│   └── config
│       └── network.js             # Network configuration settings
├── package.json                    # npm configuration file
├── .gitignore                      # Files and directories to ignore by Git
└── README.md                       # Project documentation
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd captive-portal
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Start the server:
   ```
   node server/app.js
   ```

5. Access the captive portal by navigating to `http://localhost:PORT` in your web browser.

## Usage

- Users will see the main landing page (`index.html`) when they connect to the network.
- They can enter their credentials on the `login.html` page.
- Upon successful login, users will be redirected to the `success.html` page.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.