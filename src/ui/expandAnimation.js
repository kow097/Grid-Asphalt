// Zajednicka "harmonika" animacija - CSS grid-template-rows 0fr -> 1fr trik.
// NAMJERNO bez JS mjerenja visine (scrollHeight/maxHeight) - prijasnja verzija
// je imala vizualni bug (panel bi se otvorio pa ODMAH instantno zatvorio, dok
// bi tipka ostala "aktivna") jer JS-rucno animirani max-height zna zavrsiti u
// neceljenom stanju kad se stanja isprepletu (re-render dok traje animacija,
// vise transitionend listenera, itd). CSS grid-rows tranzicija je nativna,
// bez ijedne te vrste greske - element MORA imati strukturu:
//   <div class="expand-wrap hidden">        <-- ovaj se predaje setExpanded()
//     <div class="expand-inner">...sadrzaj...</div>
//   </div>
// DURATION_MS mora se poklapati s CSS 'transition' trajanjem za .expand-wrap.
const DURATION_MS = 280;

export function setExpanded(el, expanded) {
  if (!el) return;

  if (expanded) {
    el.classList.remove('hidden');
    el.classList.remove('settled');
    el.offsetHeight; // forsiraj reflow prije animacije
    requestAnimationFrame(() => el.classList.add('expanded'));
    // 'settled' (dopusta scroll) tek NAKON sto animacija stvarno zavrsi -
    // dok red raste, jos je manji od sadrzaja pa bi overflow:auto prikazao
    // scrollbar tijekom cijele animacije koji bi nestao tek na kraju.
    setTimeout(() => el.classList.add('settled'), DURATION_MS);
  } else {
    el.classList.remove('settled');
    el.classList.remove('expanded');
    setTimeout(() => el.classList.add('hidden'), DURATION_MS);
  }
}
