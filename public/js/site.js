'use strict';

// Progressive enhancement on top of W3.JS. Every page works without this
// script; it only adds the mobile menu, the loop details and the filters.
(function () {
  var hasW3 = typeof window.w3 === 'object';

  function show(selector) {
    if (hasW3) return window.w3.show(selector);
    document.querySelectorAll(selector).forEach(function (el) { el.style.display = 'block'; });
  }

  function hide(selector) {
    if (hasW3) return window.w3.hide(selector);
    document.querySelectorAll(selector).forEach(function (el) { el.style.display = 'none'; });
  }

  function setupMobileNav() {
    var toggle = document.getElementById('nav-toggle');
    if (!toggle) return;
    hide('#mobile-nav');
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) hide('#mobile-nav'); else show('#mobile-nav');
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    });
  }

  function setupActorTabs() {
    var tabs = document.querySelectorAll('.actor-tab');
    if (!tabs.length) return;
    function select(tab) {
      hide('.actor-list');
      show('#' + tab.getAttribute('data-target'));
      tabs.forEach(function (other) { other.setAttribute('aria-pressed', String(other === tab)); });
    }
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { select(tab); });
    });
    select(tabs[0]);
  }

  function setupDynamics() {
    var detail = document.getElementById('dynamics-detail');
    var nodes = document.querySelectorAll('.dyn-node');
    if (!detail || !nodes.length) return;
    function activate(node) {
      var step = node.getAttribute('data-step');
      nodes.forEach(function (other) {
        other.classList.toggle('is-active', other.getAttribute('data-step') === step);
      });
      var actor = node.getAttribute('data-actor');
      var heading = document.createElement('h3');
      heading.textContent = 'Step ' + step + ' · ' + actor + ': ' + node.getAttribute('data-title');
      var text = document.createElement('p');
      text.textContent = node.getAttribute('data-detail');
      detail.replaceChildren(heading, text);
      detail.classList.toggle('dyn-detail-human', actor === 'Human');
      detail.classList.toggle('dyn-detail-agent', actor !== 'Human');
    }
    nodes.forEach(function (node) {
      node.addEventListener('click', function () { activate(node); });
      node.addEventListener('focus', function () { activate(node); });
      node.addEventListener('mouseenter', function () { activate(node); });
      node.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(node);
        }
      });
    });
  }

  function setupSearchFilter() {
    var input = document.getElementById('search-filter');
    if (!input) return;
    input.addEventListener('input', function () {
      if (hasW3) {
        window.w3.filterHTML('#results', '.search-result', input.value);
        return;
      }
      var term = input.value.toUpperCase();
      document.querySelectorAll('#results .search-result').forEach(function (item) {
        item.style.display = item.textContent.toUpperCase().indexOf(term) > -1 ? '' : 'none';
      });
    });
  }

  setupMobileNav();
  setupActorTabs();
  setupDynamics();
  setupSearchFilter();
})();
