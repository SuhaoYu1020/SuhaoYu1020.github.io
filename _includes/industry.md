<h2 id="industry-experience" style="margin: 2px 0px -15px;">Industry Experience</h2>

<div class="industry" style="margin-top: 20px;">

{% for company in site.data.industry.main %}

<div class="pub-row">
  <div class="col-sm-3 abbr" style="position: relative;padding-right: 15px;padding-left: 15px;">
    {% if company.logo %}
    <img src="{{ company.logo }}" class="teaser img-fluid z-depth-1" style="width: 130px; height: 130px; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    {% endif %}
  </div>
  <div class="col-sm-9" style="position: relative;padding-right: 15px;padding-left: 20px;">
    <div class="title">{{ company.name }}</div>
    <div class="author">{{ company.position }}, {{ company.duration }}</div>
    <div class="periodical"><em>{{ company.description }}</em></div>
  </div>
</div>
<br>

{% endfor %}

</div>
