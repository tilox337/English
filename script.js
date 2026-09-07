(() => {
  const STRUCTURES = {
    magma: {
      name: "Magma",
      properties: [],
      definition:
        "A magma is a set M equipped with a single binary operation · : M × M → M. The product of any two elements is again an element of M. No associativity, identity, divisibility, or inverses are assumed.",
      also: "Example: the set {rock, paper, scissors} with the operation that returns the winning throw (and a throw against itself).",
      towardGroup:
        "Three independent upgrades remain. Associativity yields a semigroup; identity yields a unital magma; divisibility yields a quasigroup. A group is the meeting point of all three paths.",
    },
    quasigroup: {
      name: "Quasigroup",
      properties: ["divisibility"],
      definition:
        "A quasigroup is a magma in which left and right division are always possible and unique: for any a, b there exist unique x, y such that a · x = b and y · a = b. The multiplication table is a Latin square. Associativity and identity are not required.",
      also: "Example: the integers under subtraction, (Z, −).",
      towardGroup:
        "A quasigroup becomes a loop by adding identity, or an associative quasigroup by adding associativity. Either of those then becomes a group by adding the remaining axiom.",
    },
    "unital-magma": {
      name: "Unital magma",
      properties: ["identity"],
      definition:
        "A unital magma is a magma that possesses an identity element e satisfying e · a = a · e = a for every a. The operation need not be associative, and equations a · x = b need not be uniquely solvable.",
      also: "Also called a magma with identity. The identity is part of the signature, not an afterthought.",
      towardGroup:
        "Add associativity to obtain a monoid, or add divisibility to obtain a loop. From a monoid, invertibility produces a group; from a loop, associativity produces a group.",
    },
    semigroup: {
      name: "Semigroup",
      properties: ["associativity"],
      definition:
        "A semigroup is a magma whose operation is associative: (a · b) · c = a · (b · c) for all a, b, c. There need not be an identity, and elements need not be invertible.",
      also: "Example: the positive integers under addition, (N, +), if 0 is excluded.",
      towardGroup:
        "Add identity to obtain a monoid, or add divisibility to obtain an associative quasigroup. A monoid becomes a group by invertibility; an associative quasigroup becomes a group by identity.",
    },
    loop: {
      name: "Loop",
      properties: ["identity", "divisibility"],
      definition:
        "A loop is a quasigroup with an identity element — equivalently, a unital magma with divisibility. Every element has a left inverse and a right inverse; those two need not coincide, and the operation need not be associative.",
      also: "Example: the nonzero octonions under multiplication form a Moufang loop.",
      towardGroup:
        "One axiom remains. Associativity turns a loop into a group.",
    },
    "associative-quasigroup": {
      name: "Associative quasigroup",
      properties: ["associativity", "divisibility"],
      definition:
        "An associative quasigroup is a quasigroup whose operation is associative — equivalently, a semigroup with divisibility. The diagram treats identity as a separate step on the way to a group.",
      also: "A theorem of algebra says that every nonempty associative quasigroup already has an identity and is therefore a group. The lattice keeps the axioms visually independent.",
      towardGroup:
        "One axiom remains, pedagogically: identity turns an associative quasigroup into a group.",
    },
    monoid: {
      name: "Monoid",
      properties: ["associativity", "identity"],
      definition:
        "A monoid is a semigroup with an identity element — equivalently, a unital magma whose operation is associative. Every group is a monoid; a monoid need not have inverses.",
      also: "Example: strings of an alphabet under concatenation, with the empty string as identity; or (N ∪ {0}, +).",
      towardGroup:
        "One axiom remains. Invertibility turns a monoid into a group. In the presence of associativity and identity, invertibility also yields unique divisibility.",
    },
    group: {
      name: "Group",
      properties: ["associativity", "identity", "divisibility", "invertibility"],
      definition:
        "A group is a monoid in which every element is invertible; equivalently a loop that is associative; equivalently an associative quasigroup with an identity. The packages are equivalent: an associative binary operation with identity and two-sided inverses, which implies unique divisibility.",
      also: "Examples: (Z, +), the nonzero reals under multiplication, and invertible n × n matrices under multiplication.",
      towardGroup:
        "This is the destination. Associativity, identity, and invertibility (and therefore divisibility) all hold.",
    },
  };

  const EDGES = [
    { from: "magma", to: "quasigroup", prop: "divisibility" },
    { from: "magma", to: "unital-magma", prop: "identity" },
    { from: "magma", to: "semigroup", prop: "associativity" },
    { from: "quasigroup", to: "loop", prop: "identity" },
    { from: "quasigroup", to: "associative-quasigroup", prop: "associativity" },
    { from: "unital-magma", to: "loop", prop: "divisibility" },
    { from: "unital-magma", to: "monoid", prop: "associativity" },
    { from: "semigroup", to: "associative-quasigroup", prop: "divisibility" },
    { from: "semigroup", to: "monoid", prop: "identity" },
    { from: "loop", to: "group", prop: "associativity" },
    { from: "associative-quasigroup", to: "group", prop: "identity" },
    { from: "monoid", to: "group", prop: "invertibility" },
  ];

  const PROP_ORDER = ["associativity", "identity", "divisibility", "invertibility"];

  const wrap = document.getElementById("lattice-wrap");
  const svg = document.getElementById("lattice-edges");
  const inspectorTitle = document.getElementById("inspector-title");
  const inspectorLede = document.getElementById("inspector-lede");
  const possessedList = document.getElementById("possessed-list");
  const groupPathText = document.getElementById("group-path-text");
  const inspectorKicker = document.getElementById("inspector-kicker");
  const matrixBody = document.querySelector("#axiom-matrix tbody");
  const defGrid = document.getElementById("def-grid");

  let selectedId = null;
  let hoverId = null;
  let focusProp = null;
  let edgeEls = [];

  const adj = {};
  Object.keys(STRUCTURES).forEach((id) => {
    adj[id] = [];
  });
  EDGES.forEach((edge) => {
    adj[edge.from].push(edge);
  });

  function pathsToGroup(start) {
    const found = [];
    const queue = [[{ id: start }]];
    while (queue.length) {
      const path = queue.shift();
      const last = path[path.length - 1].id;
      if (last === "group") {
        found.push(path);
        continue;
      }
      adj[last].forEach((edge) => {
        if (path.some((step) => step.id === edge.to)) return;
        queue.push([...path, { id: edge.to, via: edge.prop, from: edge.from }]);
      });
    }
    return found;
  }

  function relatedIds(id) {
    const ids = new Set([id, "group"]);
    EDGES.forEach((edge) => {
      if (edge.from === id || edge.to === id) {
        ids.add(edge.from);
        ids.add(edge.to);
      }
    });
    pathsToGroup(id).forEach((path) => {
      path.forEach((step) => ids.add(step.id));
    });
    return ids;
  }

  function litEdges(id) {
    const keys = new Set();
    EDGES.forEach((edge) => {
      if (edge.from === id || edge.to === id) {
        keys.add(`${edge.from}->${edge.to}`);
      }
    });
    pathsToGroup(id).forEach((path) => {
      for (let i = 1; i < path.length; i += 1) {
        keys.add(`${path[i].from}->${path[i].id}`);
      }
    });
    return keys;
  }

  function activeId() {
    return hoverId || selectedId;
  }

  function nsSvg(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    return el;
  }

  function nodeCenter(id, side) {
    const node = document.querySelector(`.node[data-id="${id}"]`);
    const box = node.getBoundingClientRect();
    const host = wrap.getBoundingClientRect();
    const x = box.left + box.width / 2 - host.left;
    const y =
      side === "bottom"
        ? box.bottom - host.top
        : side === "top"
          ? box.top - host.top
          : box.top + box.height / 2 - host.top;
    return { x, y };
  }

  function quadPoint(t, p0, p1, p2) {
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    };
  }

  function drawGraph() {
    svg.replaceChildren();
    edgeEls = [];
    if (window.matchMedia("(max-width: 720px)").matches) return;

    const size = wrap.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${size.width} ${size.height}`);
    svg.setAttribute("width", String(size.width));
    svg.setAttribute("height", String(size.height));

    const defs = nsSvg("defs", {});
    const marker = nsSvg("marker", {
      id: "arrowhead",
      markerWidth: "8",
      markerHeight: "8",
      refX: "6",
      refY: "4",
      orient: "auto",
      markerUnits: "strokeWidth",
    });
    marker.appendChild(nsSvg("path", { d: "M0 0 L8 4 L0 8 Z", fill: "currentColor" }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    EDGES.forEach((edge) => {
      const start = nodeCenter(edge.from, "bottom");
      const end = nodeCenter(edge.to, "top");
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.hypot(dx, dy) || 1;
      const bow = Math.min(28, len * 0.12);
      const cx = (start.x + end.x) / 2 - (dy / len) * bow;
      const cy = (start.y + end.y) / 2 + (dx / len) * bow;
      const y1 = start.y + 6;
      const y2 = end.y - 10;
      const d = `M ${start.x} ${y1} Q ${cx} ${cy} ${end.x} ${y2}`;

      const g = nsSvg("g", {
        class: "edge",
        "data-from": edge.from,
        "data-to": edge.to,
        "data-prop": edge.prop,
        color: "#000000",
      });
      g.appendChild(
        nsSvg("path", {
          d,
          fill: "none",
          stroke: "currentColor",
          "stroke-width": "1.6",
          "marker-end": "url(#arrowhead)",
          opacity: "0.35",
        })
      );
      const labelPoint = quadPoint(0.42, { x: start.x, y: y1 }, { x: cx, y: cy }, { x: end.x, y: y2 });
      const label = nsSvg("text", {
        x: String(labelPoint.x),
        y: String(labelPoint.y),
        class: "edge-label",
        "text-anchor": "middle",
        "paint-order": "stroke",
        stroke: "#ffffff",
        "stroke-width": "5",
        fill: "#000000",
      });
      label.textContent = edge.prop;
      g.appendChild(label);
      svg.appendChild(g);
      edgeEls.push(g);
    });

    paint();
  }

  function paint() {
    const id = activeId();
    const related = id ? relatedIds(id) : null;
    const lit = id ? litEdges(id) : new Set();
    const possessed = id ? STRUCTURES[id].properties : [];

    document.querySelectorAll(".node").forEach((node) => {
      const nid = node.dataset.id;
      node.classList.toggle("is-active", Boolean(id) && nid === id);
      node.classList.toggle("is-related", Boolean(id) && related.has(nid) && nid !== id);
      node.classList.toggle("is-dim", Boolean(id) && !related.has(nid));
      node.setAttribute("aria-pressed", nid === selectedId ? "true" : "false");
    });

    document.querySelectorAll(".prop-chip").forEach((chip) => {
      const prop = chip.dataset.prop;
      chip.classList.toggle("is-on", Boolean(id) && possessed.includes(prop));
      chip.classList.toggle(
        "is-missing",
        Boolean(id) && id !== "group" && !possessed.includes(prop)
      );
    });

    document.querySelectorAll(".essay-card").forEach((card) => {
      const prop = card.dataset.prop;
      const on = focusProp === prop || (Boolean(id) && possessed.includes(prop));
      card.classList.toggle("is-on", on);
    });

    document.querySelectorAll(".def-card").forEach((card) => {
      card.classList.toggle("is-active", card.dataset.id === id);
    });

    document.querySelectorAll("#axiom-matrix tbody tr").forEach((row) => {
      row.classList.toggle("is-active", row.dataset.id === id);
    });

    edgeEls.forEach((g) => {
      const key = `${g.dataset.from}->${g.dataset.to}`;
      const on = lit.has(key);
      const path = g.querySelector("path");
      const text = g.querySelector("text");
      g.setAttribute("color", on ? "#ff0000" : "#000000");
      path.setAttribute("opacity", on ? "1" : "0.22");
      path.setAttribute("stroke-width", on ? "2.4" : "1.5");
      text.setAttribute("fill", on ? "#ff0000" : "#000000");
      text.setAttribute("stroke", "#ffffff");
      text.setAttribute("opacity", on ? "1" : "0.7");
    });
  }

  function renderInspector(id) {
    if (!id) {
      inspectorKicker.textContent = "Now reading";
      inspectorTitle.textContent = "Choose a structure";
      inspectorLede.textContent =
        "The diagram is a map, not a taxonomy of mutually exclusive kingdoms. Every group is a monoid, a loop, and an associative quasigroup. Click Magma to start at the top.";
      possessedList.innerHTML = `<li class="muted">A binary operation, and nothing more — until you choose.</li>`;
      groupPathText.textContent =
        "A group is what you obtain when associativity, identity, and invertibility (equivalently, divisibility) hold together.";
      return;
    }

    const item = STRUCTURES[id];
    inspectorKicker.textContent = "Now reading";
    inspectorTitle.textContent = item.name;
    inspectorLede.textContent = item.definition;

    if (!item.properties.length) {
      possessedList.innerHTML =
        `<li class="muted"><span class="tag">+</span>Binary operation only. No extra axioms.</li>`;
    } else {
      possessedList.innerHTML = item.properties
        .map((prop) => `<li><span class="tag">+</span>${capitalize(prop)}</li>`)
        .join("");
    }

    groupPathText.textContent = item.towardGroup;
  }

  function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  function select(id, { persist = true } = {}) {
    if (persist) {
      selectedId = selectedId === id ? null : id;
      hoverId = null;
      focusProp = null;
    } else {
      hoverId = id;
    }
    renderInspector(activeId());
    paint();
  }

  function buildMatrix() {
    matrixBody.innerHTML = Object.entries(STRUCTURES)
      .map(([id, item]) => {
        const cells = PROP_ORDER.map((prop) => {
          const yes = item.properties.includes(prop);
          return `<td><span class="mark ${yes ? "is-yes" : ""}">${yes ? "●" : "–"}</span></td>`;
        }).join("");
        return `<tr data-id="${id}" tabindex="0"><th scope="row">${item.name}</th>${cells}</tr>`;
      })
      .join("");
  }

  function buildDefinitions() {
    defGrid.innerHTML = Object.entries(STRUCTURES)
      .map(
        ([id, item]) => `
        <button type="button" class="def-card" data-id="${id}">
          <h3>${item.name}</h3>
          <p>${item.definition}</p>
          <p class="also">${item.also}</p>
        </button>`
      )
      .join("");
  }

  function bind() {
    document.querySelectorAll(".node").forEach((node) => {
      const id = node.dataset.id;
      node.addEventListener("mouseenter", () => {
        hoverId = id;
        renderInspector(id);
        paint();
      });
      node.addEventListener("mouseleave", () => {
        hoverId = null;
        renderInspector(selectedId);
        paint();
      });
      node.addEventListener("click", () => select(id));
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select(id);
        }
      });
    });

    document.querySelectorAll(".prop-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const prop = chip.dataset.prop;
        focusProp = focusProp === prop ? null : prop;
        const match = Object.entries(STRUCTURES).find(([, item]) =>
          item.properties.includes(prop)
        );
        if (focusProp && match) {
          document.getElementById(`essay-${prop}`)?.scrollIntoView({ block: "center" });
        }
        paint();
      });
    });

    document.querySelectorAll(".essay-card").forEach((card) => {
      card.tabIndex = 0;
      card.addEventListener("click", () => {
        focusProp = card.dataset.prop;
        paint();
      });
    });

    matrixBody.addEventListener("click", (event) => {
      const row = event.target.closest("tr[data-id]");
      if (row) select(row.dataset.id);
    });
    matrixBody.addEventListener("keydown", (event) => {
      const row = event.target.closest("tr[data-id]");
      if (row && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        select(row.dataset.id);
      }
    });

    defGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".def-card");
      if (card) select(card.dataset.id);
    });

    window.addEventListener("resize", debounce(drawGraph, 80));
  }

  function debounce(fn, wait) {
    let timer = 0;
    return () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fn, wait);
    };
  }

  buildMatrix();
  buildDefinitions();
  bind();
  renderInspector(null);
  requestAnimationFrame(() => {
    drawGraph();
    paint();
  });
})();
