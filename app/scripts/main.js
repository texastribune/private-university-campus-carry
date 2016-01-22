// Components
import './components/menu';
import './components/adLoader';

const jumper = document.querySelector('#js-jumper');

jumper.addEventListener('change', (e) => {
  const value = e.target.value;

  const el = document.querySelector(`#${value}`);
  window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset - 20);
})
