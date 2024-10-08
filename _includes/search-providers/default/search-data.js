window.TEXT_SEARCH_DATA={

  {%- for _collection in site.collections -%}
    {%- unless forloop.first -%},{%- endunless -%}
    '{{ _collection.label }}':[
      {%- for _article in _collection.docs -%}
      {%- unless forloop.first -%},{%- endunless -%}
      {'title':{{ _article.title | jsonify }},
      {%- include snippets/prepend-baseurl.html path=_article.url -%}
      {%- assign _url = __return -%}
      'url':{{ _url | jsonify }}}
      {%- endfor -%}
    ]
  {%- endfor -%}

  {% assign pdf_files = site.static_files | where: "pdf", true %}
  ,'pdf':[
      {%- for pdf in pdf_files -%}
      {%- unless forloop.first -%},{%- endunless -%}
      {'title':{{ pdf.name | jsonify }},
      {%- include snippets/prepend-baseurl.html path=pdf.path -%}
      {%- assign _url = __return -%}
      'url':{{ _url | jsonify }}}
      {%- endfor -%}
    ]
};
