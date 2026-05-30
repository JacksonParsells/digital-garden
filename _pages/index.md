---
layout: page
title: Home
id: home
permalink: /
---

# Welcome to my cave!

You can learn more about who I am and why I call it that in the masterfully written [about](#about) section.

---

<strong id="recently-updated-notes">Recently discovered rooms</strong>

<ul>
  {% assign recent_notes = site.notes | sort: "last_modified_at_timestamp" | reverse %}
  {% for note in recent_notes limit: 5 %}
    <li class="recent-note-item" data-timestamp="{{ note.last_modified_at_timestamp | default: 0 }}">
      {{ note.last_modified_at | date: "%Y-%m-%d" }} — <a class="internal-link" href="{{ site.baseurl }}{{ note.url }}">{{ note.title }}</a>
    </li>
  {% endfor %}
</ul>

<style>
  .wrapper {
    max-width: 46em;
  }
</style>
