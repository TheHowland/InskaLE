class LanguageManager {
    currentLang = german;

    updatesLanguageFields() {
        this.updateLanguageLandingPage();
        this.updateLanguageSelectorPage();
        this.updateLanguageSimplifierPage();
        this.updateLanguageCheatSheetPage();
        this.updateLanguageAboutPage();
    }

    updateLanguageLandingPage() {
        document.getElementById("landing-page-greeting").innerHTML = this.currentLang.landingPageGreeting;
        document.getElementById("key-feature1heading").innerHTML = this.currentLang.keyFeature1heading;
        document.getElementById("key-feature1").innerHTML = this.currentLang.keyFeature1;
        document.getElementById("key-feature2").innerHTML = this.currentLang.keyFeature2;
        document.getElementById("key-feature2heading").innerHTML = this.currentLang.keyFeature2heading;
        document.getElementById("key-feature3").innerHTML = this.currentLang.keyFeature3;
        document.getElementById("key-feature3heading").innerHTML = this.currentLang.keyFeature3heading;
        document.getElementById("landing-page-explanation1").innerHTML = this.currentLang.landingPageExplanation1;
        document.getElementById("landing-page-explanation2").innerHTML = this.currentLang.landingPageExplanation2;
        document.getElementById("landing-page-explanation3").innerHTML = this.currentLang.landingPageExplanation3;
    }

    updateLanguageSelectorPage() {
        // circuit mapper is only instantiated in when start button pressed
        if (circuitMapper !== null) {
            for (let circuitSet of circuitMapper.circuitSets) {
                if (circuitSet.identifier === circuitMapper.selectorIds.quick) {
                    const quickHeading = document.getElementById(`${circuitMapper.selectorIds.quick}-heading`);
                    quickHeading.innerHTML = this.currentLang.selectorHeadings[circuitMapper.selectorIds.quick];
                    continue;
                }
                const titleBtn = document.getElementById(`${circuitSet.identifier}-acc-btn`);
                titleBtn.innerHTML = this.currentLang.selectorHeadings[circuitSet.identifier];
                const overviewModalBtn = document.getElementById(`${circuitSet.identifier}-overviewModalBtn`);
                overviewModalBtn.innerHTML = this.currentLang.overviewModalBtn;
            }
        }
    }

    updateLanguageSimplifierPage() {
        const InfoGifCloseBtn = document.getElementById("info-gif-close-btn");
        InfoGifCloseBtn.innerHTML = this.currentLang.closeBtn;
        const infoGifHeading = document.getElementById("info-gif-title");
        infoGifHeading.innerHTML = this.currentLang.infoGifHeading;
        const infoGifText = document.getElementById("info-gif-text");
        infoGifText.innerHTML = this.currentLang.infoGifText;
        const kirchVInfoGifHeading = document.getElementById("kirchV-info-gif-title");
        kirchVInfoGifHeading.innerHTML = this.currentLang.kirchVInfoGifHeading;
        const kirchVInfoGifText = document.getElementById("kirchV-info-gif-text");
        kirchVInfoGifText.innerHTML = this.currentLang.kirchVInfoGifText;
        const kirchVCloseBtn = document.getElementById("kirchV-info-gif-close-btn");
        kirchVCloseBtn.innerHTML = this.currentLang.closeBtn;
        const kirchIInfoGifHeading = document.getElementById("kirchI-info-gif-title");
        kirchIInfoGifHeading.innerHTML = this.currentLang.kirchIInfoGifHeading;
        const kirchIInfoGifText = document.getElementById("kirchI-info-gif-text");
        kirchIInfoGifText.innerHTML = this.currentLang.kirchIInfoGifText;
        const kirchICloseBtn = document.getElementById("kirchI-info-gif-close-btn");
        kirchICloseBtn.innerHTML = this.currentLang.closeBtn;
        const gameOverHeading = document.getElementById("game-over-title");
        gameOverHeading.innerHTML = this.currentLang.gameOverHeading;
        const gameOverText = document.getElementById("game-over-text");
        gameOverText.innerHTML = this.currentLang.gameOverText;
        const gameOverCloseBtn = document.getElementById("game-over-close-btn");
        gameOverCloseBtn.innerHTML = this.currentLang.closeBtn;
        const extraLiveHeading = document.getElementById("extra-live-title");
        extraLiveHeading.innerHTML = this.currentLang.gameOverHeading;
        const extraLiveText = document.getElementById("extra-live-text");
        extraLiveText.innerHTML = this.currentLang.extraLiveText;
        const extraLiveCloseBtn = document.getElementById("extra-live-close-btn");
        extraLiveCloseBtn.innerHTML = this.currentLang.closeBtn;
    }

    updateLanguageCheatSheetPage() {
        const subHeading = document.getElementById("substitutionTableHeading");
        subHeading.innerHTML = this.currentLang.subTableHeading;
        const series = document.getElementById("seriesHeading");
        series.innerHTML = this.currentLang.subTableSeriesHeading;
        const parallel = document.getElementById("parallelHeading");
        parallel.innerHTML = this.currentLang.subTableParallelHeading;
        const subResCol = document.getElementById("subTableResHeading");
        subResCol.innerHTML = this.currentLang.resistorRowHeading;
        const subCapCol = document.getElementById("subTableCapHeading");
        subCapCol.innerHTML = this.currentLang.capacitorRowHeading;
        const subIndCol = document.getElementById("subTableIndHeading");
        subIndCol.innerHTML = this.currentLang.inductorRowHeading;

        const resReaHeading = document.getElementById("resistanceReactanceTableHeading");
        resReaHeading.innerHTML = this.currentLang.resReaTableHeading;
        const resCol = document.getElementById("resistance");
        resCol.innerHTML = this.currentLang.resistanceColHeading;
        const reaCol = document.getElementById("reactance");
        reaCol.innerHTML = this.currentLang.reactanceColHeading;
        const res = document.getElementById("resistor");
        res.innerHTML = this.currentLang.resistorRowHeading;
        const cap = document.getElementById("capacitor");
        cap.innerHTML = this.currentLang.capacitorRowHeading;
        const ind = document.getElementById("inductor");
        ind.innerHTML = this.currentLang.inductorRowHeading;
    }

    updateLanguageAboutPage() {
        const aboutText = document.getElementById('about-text');
        aboutText.innerHTML = this.currentLang.aboutText;
    }

    updateDataPrivacyPage() {
        const backBtn = document.getElementById('back-btn-data-privacy');
        backBtn.innerHTML = this.currentLang.dataPrivacyBackBtn;
    }

    updateLegalNoticePage() {
        const backBtn = document.getElementById('back-btn-legal');
        backBtn.innerHTML = this.currentLang.dataPrivacyBackBtn;
        const legalNoticeHeading = document.getElementById('legal-notice-heading');
        legalNoticeHeading.innerHTML = this.currentLang.legalNoticeHeading;
    }

}