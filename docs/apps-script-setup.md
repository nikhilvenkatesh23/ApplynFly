# Profile evaluation form setup

1. Create a Google Sheet for evaluation submissions.
2. In **Extensions → Apps Script**, paste the code from [`apps-script.gs`](./apps-script.gs). Copy the Sheet ID from its URL and replace `REPLACE_WITH_YOUR_GOOGLE_SHEET_ID`.
3. Deploy the script as a **Web app**, set it to execute as you, allow access to **Anyone**, and authorize the requested Sheets access. The script creates a `Profile Evaluations` tab and column headers if needed.
4. Copy the deployed web app URL ending in `/exec` into `APPS_SCRIPT_URL` at the top of `assets/js/main.js`.
5. Test the form from the deployed site and confirm that a timestamped row appears in the Sheet.

The web app URL is public so the static site can submit to it. Restrict access to the destination Sheet, and redeploy the web app after changing its code. The form sends a simple `text/plain` JSON POST to avoid a browser preflight request; if the deployed site reports a browser CORS error, do not treat the request as successful—the form will show an error instead.
