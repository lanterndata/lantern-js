# Contributing to lantern-js

## Prerequisites

* Node.js (Version 14 or higher)
* npm (Version 6 or higher)
* Postgres database with Lantern extensions installed

## Installation

1. Fork this repository to your own GitHub account and then clone it to your local device.

    ```bash
    git clone https://github.com/your-username/lantern-js.git
    ```

2. Navigate to the cloned project directory and install the dependencies

    ```bash
    cd lantern-js
    npm i
    ```

3. Copy the example environment file and configure it

    ```bash
    cp .env.example .env
    ```

## Code Style Guide

To check for linting errors:

```bash
npm run lint
```

To fix linting errors:

```bash
npm run lint:fix
```

To format the code using Prettier:

```bash
npm run prettier:format
```

To check if the code is formatted correctly:

```bash
npm run prettier:check
```

To fix linting errors and format the code:

```bash
npm run format
```

## Testing

Ensure all tests pass before submitting a pull request. To run the tests:

```bash
npm test
```

To run the tests with coverage:

```bash
npm run coverage
```

Place your test files in the `test/` directory.
