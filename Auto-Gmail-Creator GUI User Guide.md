# Auto-Gmail-Creator GUI User Guide

The **Auto-Gmail-Creator GUI** is a comprehensive graphical interface designed to streamline the automation of Gmail account creation. By wrapping the core functionality of the original script into a user-friendly window, it allows for easier configuration and monitoring of the account generation process.

### Core Capabilities

The application provides several key features to enhance the user experience and ensure successful account creation.

| Feature | Description |
| :--- | :--- |
| **Automated Installation** | A single-click solution to manage all Python dependencies and environment setup. |
| **Customizable Settings** | Users can define the specific number of accounts to be created and set a global password. |
| **Real-time Logging** | An integrated activity log provides immediate feedback on the status of each creation attempt. |
| **Proxy Integration** | The system automatically fetches and utilizes free proxies to mitigate IP-based restrictions. |

### Operational Instructions

To begin using the application, follow the structured steps outlined below.

#### 1. Initial Setup and Launch
The primary entry point for the application is the `setup_and_run.py` script. Executing this script will initiate a pre-flight check of the environment, ensuring that all required libraries such as `selenium`, `requests`, and `unidecode` are present. If any dependencies are missing, the script will automatically install them before launching the main GUI.

```bash
python setup_and_run.py
```

#### 2. Configuration and Execution
Once the interface is active, you can configure the operational parameters. Enter the desired **Number of Accounts** and the **Default Password** in the settings panel. After configuration, click the **Start Creation** button. The application will then initialize a Selenium-controlled Chrome instance to navigate the Gmail registration process.

> **Note:** It is essential to have a modern version of Google Chrome installed on your system, as the automation relies on a compatible `chromedriver` to interact with the browser.

#### 3. Output and Data Management
Upon the successful creation of an account, the credentials will be appended to a local file named `emails.txt`. This file serves as a persistent record of all generated accounts, formatted for easy extraction and use.

### Troubleshooting and Technical Considerations

While the tool is designed for automation, certain external factors may influence its performance.

*   **Browser Compatibility:** If the automation fails to launch, verify that your Chrome browser is updated to the latest version.
*   **Network Stability:** Since the tool utilizes free proxies, connection speeds may vary. If a timeout occurs, restarting the process will trigger the selection of a new proxy.
*   **Verification Hurdles:** Google's security algorithms may occasionally mandate phone verification. If the automation cannot bypass this step due to IP reputation, it will be noted in the activity log.

---
*Prepared for Nordsec*
