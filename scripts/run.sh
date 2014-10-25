#!/bin/bash

./scripts/config.env;
NODE_ENV=development PORT=3001 forever app.js