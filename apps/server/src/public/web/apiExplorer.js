(() => {
  try {
    const root = document.getElementById('apiExplorerRoot');
    if (!root) {
      return;
    }

    const dataNode = document.getElementById('apiExplorerData');
    const rawJson = dataNode?.value ?? '[]';
    const endpoints = JSON.parse(rawJson);
    const apiPrefix = String(root.getAttribute('data-api-prefix') ?? '');

    const state = {
      search: '',
      usage: 'all',
      auth: 'all',
      method: 'all',
      sortBy: 'path',
      selectedId: endpoints[0]?.id ?? null
    };

    const nodes = {
      apiRows: document.getElementById('apiRows'),
      usageFilter: document.getElementById('usageFilter'),
      authFilter: document.getElementById('authFilter'),
      methodFilter: document.getElementById('methodFilter'),
      sortBy: document.getElementById('sortBy'),
      apiSearch: document.getElementById('apiSearch'),
      apiSummary: document.getElementById('apiSummary'),
      activeMethod: document.getElementById('activeMethod'),
      activePath: document.getElementById('activePath'),
      activePurpose: document.getElementById('activePurpose'),
      activeAuth: document.getElementById('activeAuth'),
      pathParamInputs: document.getElementById('pathParamInputs'),
      queryParamInputs: document.getElementById('queryParamInputs'),
      requestBodyInput: document.getElementById('requestBodyInput'),
      sendRequestButton: document.getElementById('sendRequestButton'),
      responseOutput: document.getElementById('responseOutput'),
      requestStatus: document.getElementById('requestStatus'),
      apiKeyInput: document.getElementById('apiKeyInput'),
      bearerInput: document.getElementById('bearerInput')
    };

    const requiredNodes = ['apiRows', 'usageFilter', 'authFilter', 'methodFilter', 'sortBy', 'apiSearch', 'apiSummary', 'sendRequestButton'];
    for (const key of requiredNodes) {
      if (!nodes[key]) {
        throw new Error('Missing required UI node: ' + key);
      }
    }

    const usageValues = [...new Set(endpoints.map((item) => item.usage))].sort();
    for (const usage of usageValues) {
      const option = document.createElement('option');
      option.value = usage;
      option.textContent = usage;
      nodes.usageFilter.append(option);
    }

    const normalize = (value) => String(value ?? '').toLowerCase();
    const sorters = {
      path: (a, b) => a.pathTemplate.localeCompare(b.pathTemplate),
      usage: (a, b) => a.usage.localeCompare(b.usage) || a.pathTemplate.localeCompare(b.pathTemplate),
      auth: (a, b) => a.auth.localeCompare(b.auth) || a.pathTemplate.localeCompare(b.pathTemplate),
      method: (a, b) => a.method.localeCompare(b.method) || a.pathTemplate.localeCompare(b.pathTemplate)
    };
    const authKind = (value) => (value.includes('Authorization: Bearer') ? 'api-key-bearer' : 'api-key-only');

    const currentEndpoint = () => endpoints.find((item) => item.id === state.selectedId) ?? null;

    const filteredEndpoints = () =>
      endpoints
        .filter((item) => (state.usage === 'all' ? true : item.usage === state.usage))
        .filter((item) => (state.auth === 'all' ? true : authKind(item.auth) === state.auth))
        .filter((item) => (state.method === 'all' ? true : item.method === state.method))
        .filter((item) => {
          if (!state.search) return true;
          const haystack = normalize([item.method, item.pathTemplate, item.usage, item.purpose, item.auth].join(' '));
          return haystack.includes(state.search);
        })
        .sort(sorters[state.sortBy] ?? sorters.path);

    const escapeText = (value) =>
      String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const renderSummary = (items) => {
      const byUsage = {};
      for (const item of items) {
        byUsage[item.usage] = (byUsage[item.usage] ?? 0) + 1;
      }

      const usageParts = Object.entries(byUsage)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([usage, count]) => '<code>' + escapeText(usage) + ': ' + count + '</code>')
        .join(' ');

      nodes.apiSummary.innerHTML = '<span><strong>' + items.length + '</strong> endpoints shown.</span>' + '<span>' + usageParts + '</span>';
    };

    const renderRows = () => {
      const items = filteredEndpoints();
      renderSummary(items);

      if (!items.some((item) => item.id === state.selectedId)) {
        state.selectedId = items[0]?.id ?? null;
      }

      nodes.apiRows.innerHTML = items
        .map((item) => {
          const selectedClass = item.id === state.selectedId ? 'selected-row' : '';
          return (
            '<tr class="' + selectedClass + '" data-endpoint-id="' + escapeText(item.id) + '">' +
            '<td><code>' + escapeText(item.method) + '</code></td>' +
            '<td><code>' + escapeText(apiPrefix + item.pathTemplate) + '</code></td>' +
            '<td>' + escapeText(item.usage) + '</td>' +
            '<td>' + escapeText(item.purpose) + '</td>' +
            '<td>' + escapeText(item.auth) + '</td>' +
            '<td><button type="button" class="try-btn" data-try-id="' + escapeText(item.id) + '">Try</button></td>' +
            '</tr>'
          );
        })
        .join('');
    };

    const dynamicInputHtml = (groupLabel, values, keyPrefix) => {
      if (!values?.length) return '';
      return (
        '<fieldset><legend>' +
        escapeText(groupLabel) +
        '</legend>' +
        values
          .map((entry) => {
            const id = keyPrefix + '-' + entry.name;
            return (
              '<label>' +
              escapeText(entry.name) +
              (entry.required ? ' *' : '') +
              '<input id="' +
              escapeText(id) +
              '" data-key="' +
              escapeText(entry.name) +
              '" data-required="' +
              (entry.required ? '1' : '0') +
              '" placeholder="' +
              escapeText(entry.example ?? '') +
              '" />' +
              '</label>'
            );
          })
          .join('') +
        '</fieldset>'
      );
    };

    const renderContract = () => {
      const endpoint = currentEndpoint();
      if (!endpoint) {
        nodes.activeMethod.textContent = '';
        nodes.activePath.textContent = '';
        nodes.activePurpose.textContent = 'No endpoint selected.';
        nodes.activeAuth.textContent = '';
        nodes.pathParamInputs.innerHTML = '';
        nodes.queryParamInputs.innerHTML = '';
        nodes.requestBodyInput.value = '';
        return;
      }

      nodes.activeMethod.textContent = endpoint.method;
      nodes.activePath.textContent = apiPrefix + endpoint.pathTemplate;
      nodes.activePurpose.textContent = endpoint.purpose + ' [' + endpoint.usage + ']';
      nodes.activeAuth.textContent = 'Auth: ' + endpoint.auth;
      nodes.pathParamInputs.innerHTML = dynamicInputHtml('Path Params', endpoint.pathParams, 'path');
      nodes.queryParamInputs.innerHTML = dynamicInputHtml('Query Params', endpoint.queryParams, 'query');

      if (endpoint.requestBody === null) {
        nodes.requestBodyInput.value = '';
        nodes.requestBodyInput.disabled = true;
        nodes.requestBodyInput.placeholder = 'No request body for this endpoint.';
      } else {
        nodes.requestBodyInput.disabled = false;
        nodes.requestBodyInput.value = JSON.stringify(endpoint.requestBody, null, 2);
      }
    };

    const wireRowActions = () => {
      const rowButtons = nodes.apiRows.querySelectorAll('button[data-try-id]');
      for (const button of rowButtons) {
        button.addEventListener('click', () => {
          state.selectedId = button.getAttribute('data-try-id');
          renderRows();
          renderContract();
          wireRowActions();
        });
      }
    };

    const applyFilters = () => {
      state.search = normalize(nodes.apiSearch.value).trim();
      state.usage = nodes.usageFilter.value;
      state.auth = nodes.authFilter.value;
      state.method = nodes.methodFilter.value;
      state.sortBy = nodes.sortBy.value;
      renderRows();
      renderContract();
      wireRowActions();
    };

    const requiredInputMissing = (container) => {
      for (const input of container.querySelectorAll('input[data-key]')) {
        const required = input.getAttribute('data-required') === '1';
        if (required && !String(input.value ?? '').trim()) {
          return input.getAttribute('data-key');
        }
      }
      return null;
    };

    const getInputValueMap = (container) => {
      const result = {};
      for (const input of container.querySelectorAll('input[data-key]')) {
        const key = input.getAttribute('data-key');
        const value = String(input.value ?? '').trim();
        if (value) {
          result[key] = value;
        }
      }
      return result;
    };

    nodes.sendRequestButton.addEventListener('click', async () => {
      const endpoint = currentEndpoint();
      if (!endpoint) return;

      const missingPath = requiredInputMissing(nodes.pathParamInputs);
      if (missingPath) {
        nodes.requestStatus.textContent = 'Missing path param: ' + missingPath;
        return;
      }

      const missingQuery = requiredInputMissing(nodes.queryParamInputs);
      if (missingQuery) {
        nodes.requestStatus.textContent = 'Missing query param: ' + missingQuery;
        return;
      }

      const pathValues = getInputValueMap(nodes.pathParamInputs);
      const queryValues = getInputValueMap(nodes.queryParamInputs);

      let path = endpoint.pathTemplate;
      for (const [key, value] of Object.entries(pathValues)) {
        path = path.replace(':' + key, encodeURIComponent(value));
      }

      const query = new URLSearchParams(queryValues);
      const url = apiPrefix + path + (query.toString() ? '?' + query.toString() : '');

      const headers = { Accept: 'application/json' };
      const apiKey = String(nodes.apiKeyInput.value ?? '').trim();
      const bearer = String(nodes.bearerInput.value ?? '').trim();

      if (apiKey) headers['x-api-key'] = apiKey;
      if (bearer) headers.Authorization = 'Bearer ' + bearer;

      let bodyText = '';
      const withBody = endpoint.requestBody !== null;
      if (withBody) {
        bodyText = String(nodes.requestBodyInput.value ?? '').trim();
        headers['Content-Type'] = 'application/json';
        if (!bodyText) bodyText = '{}';

        try {
          JSON.parse(bodyText);
        } catch (error) {
          nodes.requestStatus.textContent = 'Invalid JSON body.';
          nodes.responseOutput.textContent = String(error);
          return;
        }
      }

      nodes.requestStatus.textContent = 'Sending...';
      nodes.responseOutput.textContent = '';

      try {
        const response = await fetch(url, {
          method: endpoint.method,
          headers,
          body: withBody ? bodyText : undefined
        });

        const responseText = await response.text();
        const headerLines = [];
        response.headers.forEach((value, key) => headerLines.push(key + ': ' + value));

        let prettyBody = responseText;
        try {
          prettyBody = JSON.stringify(JSON.parse(responseText), null, 2);
        } catch {
          // Keep plain text if non-JSON.
        }

        nodes.requestStatus.textContent = 'Completed with HTTP ' + response.status;
        nodes.responseOutput.textContent =
          'HTTP ' + response.status + ' ' + response.statusText + '\n' + headerLines.join('\n') + '\n\n' + prettyBody;
      } catch (error) {
        nodes.requestStatus.textContent = 'Request failed.';
        nodes.responseOutput.textContent = String(error);
      }
    });

    for (const node of [nodes.apiSearch, nodes.usageFilter, nodes.authFilter, nodes.methodFilter, nodes.sortBy]) {
      node.addEventListener('input', applyFilters);
      node.addEventListener('change', applyFilters);
    }

    applyFilters();
    wireRowActions();
  } catch (error) {
    const summaryNode = document.getElementById('apiSummary');
    if (summaryNode) {
      summaryNode.textContent = 'API explorer script error: ' + String(error?.message ?? error);
      summaryNode.style.color = '#b91c1c';
      summaryNode.style.fontWeight = '600';
    }
  }
})();
