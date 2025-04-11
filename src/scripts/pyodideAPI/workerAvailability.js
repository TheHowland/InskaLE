function testForWorkerAvailability() {
    let workerCanBeUsed = !!window.Worker;
    // Show alert if worker cannot be used, don't load further
    if (!workerCanBeUsed) {
        alert("Web Worker not supported in this browser\n" +
            "Please try a newer browser version or a different browser\n" +
            "You could use:\n" +
            "- Google Chrome (since version 4-134)\n" +
            "- Microsoft Edge (since version 12-133)\n" +
            "- Safari (since version 4-18.2)\n" +
            "- Mozilla Firefox (since version 3.5-136)\n" +
            "- Samsung Internet (since version 4-26)\n" +
            "- Safari on iOS (since version 5-18.2)\n" +
            "- Chrome for Android (since version 134)\n" +
            "- Basically anything that's not 10 years old :)\n");
        window.stop();
    }
}
