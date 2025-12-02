# Frontend Build Plan

This document outlines the plan for building the frontend of the HCP CRM application.

## 1. Tech Stack

*   **Framework:** React
*   **State Management:** Redux with Redux Toolkit
*   **HTTP Client:** Axios
*   **Styling:** Tailwind CSS

## 2. File Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── LogInteraction.js
│   ├── features/
│   │   └── interactionSlice.js
│   ├── App.js
│   ├── index.css
│   ├── index.js
│   └── store.js
├── package.json
├── postcss.config.js
└── tailwind.config.js
```

## 3. Component Breakdown

### `LogInteraction.js`

*   This will be a form component.
*   It will have input fields for:
    *   HCP Name (text input)
    *   Interaction Type (select dropdown: Meeting/Call)
    *   Date (date picker)
    *   Topics Discussed (textarea)
    *   Sentiment (buttons: Positive/Neutral/Negative)
*   On form submission, it will construct a natural language string from the form data.
*   It will use `axios` to send a POST request to `http://127.0.0.1:8000/chat` with the natural language string.

### `App.js`

*   This will be the main component.
*   It will render the `LogInteraction` component.
*   It will wrap the application with the Redux `Provider`.

## 4. State Management (Redux)

### `interactionSlice.js`

*   This slice will manage the state of the `LogInteraction` form.
*   It will have state properties for `hcpName`, `type`, `date`, `notes`, and `sentiment`.
*   It will have reducers to update each of these state properties.
*   It will have a `resetForm` reducer to clear the form after a successful submission.

### `store.js`

*   This will configure the Redux store.
*   It will combine the reducers from the slices.

## 5. Styling

*   Tailwind CSS will be used for styling.
*   The `tailwind.config.js` and `postcss.config.js` files will be configured.
*   The `index.css` file will include the Tailwind directives.

## 6. Setup and Execution

1.  Create the directory structure.
2.  Create the `package.json` with the required dependencies.
3.  Create the Redux store and slice.
4.  Create the React components.
5.  Create the necessary configuration files for Tailwind CSS.
6.  The user will then need to install the dependencies using `npm install` and run the application using `npm start`.
