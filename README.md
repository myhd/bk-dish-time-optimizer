# DishTime

DishTime turns a desired finish time into the right delayed-start setting for a dishwasher. It removes the guesswork when the machine lets you delay the start, but not choose when the cycle should finish.

[Open DishTime](https://myhd.github.io/bk-dish-time-optimizer/)

<p align="center">
  <img src="assets/readme/dishtime-iphone17-galaxy-s25.webp" width="800" alt="DishTime shown in English on an iPhone 17 and in Spanish dark mode on a Samsung Galaxy S25+">
</p>

<p align="center"><sub>Device frame based on <a href="https://github.com/mbdev3/react-mockframe">react-mockframe</a> · <a href="assets/readme/react-mockframe-LICENSE.txt">MIT license</a></sub></p>

## What it does

- Finds the closest available finish time for the selected program.
- Shows the delay setting and number of button presses.
- Makes alternative programs and finish times easy to compare.
- Supports Deutsch, English, Español, Français, Nederlands, and Українська.

## See it in action

<p align="center">
  <img src="assets/readme/dishtime-demo.gif" width="440" alt="Animated DishTime demo showing target-time entry, finish-time scrubbing, program comparison, and the resulting dishwasher settings">
</p>

<p align="center"><sub>Enter a target time, compare the available options, and use the calculated program and delay.</sub></p>

## Where it runs

DishTime is a small client-side web app for modern mobile and desktop browsers. It needs no account or backend and can be added to a phone's home screen.

The included profile is configured for a Bauknecht dishwasher. Machine data lives in [`machine-config.js`](machine-config.js); general app settings live in [`app-config.js`](app-config.js).
