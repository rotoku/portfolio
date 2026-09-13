(() => {
    "use strict";

    const characterSets = {
        uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
        lowercase: "abcdefghijkmnopqrstuvwxyz",
        numbers: "23456789",
        special: "!@#$%&*()_+"
    };

    const controls = {
        output: document.querySelector("#password-output"),
        copyButton: document.querySelector("#copy-button"),
        copyLabel: document.querySelector(".copy-label"),
        generateButton: document.querySelector("#generate-button"),
        lengthRange: document.querySelector("#length-range"),
        lengthValue: document.querySelector("#length-value"),
        strengthLabel: document.querySelector("#strength-label"),
        strengthSegments: [...document.querySelectorAll(".strength-segment")],
        status: document.querySelector("#password-status"),
        options: [...document.querySelectorAll(".character-option")]
    };

    const optionMap = {
        "include-uppercase": "uppercase",
        "include-lowercase": "lowercase",
        "include-numbers": "numbers",
        "include-special": "special"
    };

    function secureRandomIndex(maximum) {
        if (!window.crypto?.getRandomValues || maximum < 1) {
            throw new Error("A geração segura não está disponível neste navegador.");
        }

        const randomValue = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / maximum) * maximum;

        do {
            window.crypto.getRandomValues(randomValue);
        } while (randomValue[0] >= limit);

        return randomValue[0] % maximum;
    }

    function chooseCharacter(characters) {
        return characters[secureRandomIndex(characters.length)];
    }

    function shuffle(characters) {
        for (let index = characters.length - 1; index > 0; index -= 1) {
            const swapIndex = secureRandomIndex(index + 1);
            [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
        }
        return characters;
    }

    function getSelectedSets() {
        return controls.options
            .filter((option) => option.checked)
            .map((option) => characterSets[optionMap[option.id]]);
    }

    function generatePassword(length, selectedSets) {
        const completeSet = selectedSets.join("");
        const passwordCharacters = selectedSets.map((set) => chooseCharacter(set));

        while (passwordCharacters.length < length) {
            passwordCharacters.push(chooseCharacter(completeSet));
        }

        return shuffle(passwordCharacters).join("");
    }

    function updateStrength(length, selectedCount) {
        const score = Math.min(4, Math.floor((length - 8) / 12) + selectedCount);
        const level = score <= 1 ? "weak" : score <= 2 ? "medium" : "strong";
        const labels = { weak: "Fraca", medium: "Boa", strong: "Forte" };

        controls.strengthSegments.forEach((segment, index) => {
            segment.classList.toggle("active", index < score);
            segment.classList.toggle("weak", index < score && level === "weak");
            segment.classList.toggle("medium", index < score && level === "medium");
        });
        controls.strengthLabel.textContent = labels[level];
        controls.strengthLabel.style.color = level === "weak" ? "var(--orange-dark)" : level === "medium" ? "#a16b12" : "var(--mint-deep)";
    }

    function updateLengthLabel() {
        controls.lengthValue.textContent = controls.lengthRange.value;
    }

    function generate() {
        const length = Number(controls.lengthRange.value);
        const selectedSets = getSelectedSets();

        updateLengthLabel();

        if (selectedSets.length === 0) {
            controls.output.value = "";
            controls.strengthLabel.textContent = "Indisponível";
            controls.strengthSegments.forEach((segment) => segment.classList.remove("active", "weak", "medium"));
            controls.status.textContent = "Selecione pelo menos uma categoria para gerar a senha.";
            return;
        }

        try {
            controls.output.value = generatePassword(length, selectedSets);
            updateStrength(length, selectedSets.length);
            controls.status.textContent = "Gerada localmente no seu navegador.";
        } catch (error) {
            controls.output.value = "";
            controls.status.textContent = error.message;
        }
    }

    async function copyPassword() {
        if (!controls.output.value) {
            controls.status.textContent = "Gere uma senha antes de copiar.";
            return;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(controls.output.value);
            } else {
                const temporaryInput = document.createElement("textarea");
                temporaryInput.value = controls.output.value;
                temporaryInput.setAttribute("readonly", "");
                temporaryInput.style.position = "fixed";
                temporaryInput.style.opacity = "0";
                document.body.appendChild(temporaryInput);
                temporaryInput.select();
                document.execCommand("copy");
                temporaryInput.remove();
            }

            controls.copyLabel.textContent = "Copiada";
            controls.status.textContent = "Senha copiada para a área de transferência.";
            window.setTimeout(() => {
                controls.copyLabel.textContent = "Copiar";
            }, 1800);
        } catch {
            controls.status.textContent = "Não foi possível copiar automaticamente. Selecione a senha e copie manualmente.";
        }
    }

    controls.lengthRange.addEventListener("input", generate);
    controls.options.forEach((option) => option.addEventListener("change", generate));
    controls.generateButton.addEventListener("click", generate);
    controls.copyButton.addEventListener("click", copyPassword);

    generate();
})();
