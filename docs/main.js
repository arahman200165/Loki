const hero = document.querySelector(".hero");
const revealTargets = document.querySelectorAll(".reveal, .reveal-block");

if (hero) {
  const setHeroShift = (x, y) => {
    hero.style.setProperty("--hero-shift-x", `${x}px`);
    hero.style.setProperty("--hero-shift-y", `${y}px`);
  };

  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    setHeroShift(x * 18, y * 18);
  });

  hero.addEventListener("pointerleave", () => {
    setHeroShift(0, 0);
  });
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "0px 0px -10%",
    }
  );

  revealTargets.forEach((target) => observer.observe(target));
} else {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
}
