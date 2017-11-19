**NOTE: This project was primarily a learning exercise and it's primary usefulness could be easily replaced with a couple scripts.**

# TestMan

TestMan is a simple desktop app designed to ease testing for HTML5 games or other canvas-based applications. TestMan is designed
specfically with the [Phaser](http://phaser.io/) framework in mind, but should work equally well with other canvas-based frameworks
([PixiJS](http://www.pixijs.com/), [BabylonJS](http://www.babylonjs.com/), etc). This app is built/packaged using [electron](http://electron.atom.io/).

### Usage

To use TestMan, simply direct it to your app's entry point (`index.html` for example). The app's content will be served locally via [express](http://expressjs.com/)
and can be accessed on mobile devices using the browser or the [CocoonJS Developer App](https://play.google.com/store/apps/details?id=com.ludei.devapp) (recommended).
Note that node-based applications which have not been transpiled will only run in the TestMan desktop environment. There are various scaling options available, including preset and custom aspect ratios to get an idea for how your app will scale on different devices.
