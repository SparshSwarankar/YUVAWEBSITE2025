# YUVA Delhi - Super Admin Dashboard Enhancements

This document outlines the powerful new features added to the Super Admin dashboard, transforming it into a central command system for managing the entire YUVA Delhi platform.

## Overview

The goal of these enhancements is to provide Super Admins with comprehensive control and visibility over all zones, conveners, mentors, and colleges. The new "Super Admin Panel" is a dedicated section visible only to users with the `super_admin` role and serves as the main control center.

---

## New Features

### 1. Zone Performance Overview
This panel provides a high-level, at-a-glance summary of key metrics for each operational zone.

* **Functionality:** Displays a grid of cards, with each card representing a zone.
* **Metrics Shown:**
    * **Total Colleges:** The number of colleges registered within that zone.
    * **Total Members:** The total count of all members (mentors, conveners, etc.) across all colleges in that zone.
* **Purpose:** Allows for quick comparison of zone activity and growth, helping to identify which zones are most active or may need more support.



### 2. User Role Management
A dedicated table for managing the access rights of all administrative users (Zone Conveners and Mentors).

* **Functionality:** Lists all registered admin users with their name, email, and current role.
* **Actions:**
    * **Change Role:** Super Admins can use a dropdown menu to dynamically change a user's role between `Mentor` and `Zone Convener`.
    * **Save Changes:** Clicking the "Save" button instantly updates the user's permissions in the database.
* **Purpose:** Provides a centralized and secure way to manage user access without needing direct database intervention. Super Admins cannot have their own roles changed from this panel for security.

### 3. Quick Notice Broadcaster
A direct communication system for sending announcements, reminders, or alerts to specific user groups.

* **Functionality:** A simple form to compose and send email-based notices.
* **Targeting Options:**
    * All Zone Conveners
    * All Mentors
    * All members of a specific zone (e.g., "Zone: East Delhi")
* **Purpose:** Streamlines communication by allowing the Super Admin to broadcast important information directly from the dashboard, eliminating the need for external email clients.

### 4. Enhanced Data Management
This section provides granular control for exporting specific data sets to Google Sheets.

* **Functionality:** Includes one-click buttons to trigger specific data exports.
* **Export Options:**
    * **Export All Users:** Generates a Google Sheet containing a list of all administrative users (`admin_users` table).
    * **Export All Colleges:** Generates a Google Sheet with a detailed list of all colleges from the `college_details` view.
* **Behavior:** Clicking a button opens the fully-populated Google Sheet in a new tab, leveraging the pre-configured Sheet ID.

### 5. User Activity Monitor
This panel provides an audit trail of recent actions performed by administrators, enhancing accountability and transparency.

* **Functionality:** Displays a real-time feed of the latest actions recorded in the `activity_log` table.
* **Information Logged:**
    * **Who:** The email of the user who performed the action.
    * **What:** The type of action (e.g., `update_registration`, `create_college`).
    * **When:** A timestamp of when the action occurred.
* **Purpose:** Helps Super Admins monitor system activity, troubleshoot issues, and ensure that administrative actions are being performed correctly.