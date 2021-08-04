import { themeSet, themeGet } from "../theme";

export const build = () => {
    try {
        // On theme switcher button click (mouseup is a tiny bit more efficient) toggle the theme between dark and light mode
        let themeSwitch = Array.from(document.querySelectorAll(".theme-toggle"));
        if (themeSwitch[0]) {
            for (let el of themeSwitch)
                el.addEventListener("click", () => {
                    themeSet(themeGet() === "dark" ? "light" : "dark");
                });
        }
    } catch (e) {
        console.warn("Theming seems to break on this browser.", e);
    }

    const navbar = document.querySelector(".navbar") as HTMLElement;

    let canScroll = true;
    window.addEventListener("scroll", () => {
        if (canScroll) {
            let raf: number | void;
            canScroll = false;
            raf = requestAnimationFrame(() => {
                navbar.classList.toggle("shadow", window.scrollY >= 5);

                canScroll = true;
                raf = window.cancelAnimationFrame(raf as number);
            });
        }
    }, { passive: true });
};