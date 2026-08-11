# Privacy

Cryptic Quest is local-first by design.

## Data stored

The application stores learning progress in the browser's local storage, including XP, completed missions, skill statistics, achievements, chosen difficulty, challenge progress, and daily streak dates.

## Data not collected

The application contains no analytics SDK, tracking pixel, advertising code, account system, telemetry endpoint, remote database, or third-party runtime script.

## Network behavior

After deployment, the browser naturally requests the static application files from the host. The service worker may fetch same-origin application assets to update its cache. The application itself does not send learner answers or progress to a server.

## Export/import

Progress export creates a JSON file locally in the browser. Progress import reads a user-selected JSON file locally. The application does not upload the file.

## Clearing data

Use **Profile → Reset local progress**, or clear site data in the browser.
