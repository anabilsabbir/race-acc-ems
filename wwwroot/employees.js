// List page: Add and Edit open their own pages; Delete runs here with AJAX.
$(function () {
  const $table = $("#employee-table");
  const $rows = $("#rows");
  const $status = $("#status");
  const token = $('input[name="__RequestVerificationToken"]').val();

  let statusTimer = null;

  // Hide a success notice after 3 seconds (error notices stay until the next action)
  function autoHideStatus() {
    clearTimeout(statusTimer);
    if (!$status.hasClass("error")) {
      statusTimer = setTimeout(function () {
        $status.prop("hidden", true);
      }, 3000);
    }
  }

  function showStatus(message, isError) {
    $status.text(message).toggleClass("error", !!isError).prop("hidden", false);
    autoHideStatus();
  }

  // "Employee added." / "Employee updated." comes from the server after a redirect
  if (!$status.prop("hidden")) {
    autoHideStatus();
  }

  function showEmptyIfNeeded() {
    if ($rows.find("tr[data-id]").length) {
      return;
    }

    const term = $.trim($search.val());
    const message = term
      ? 'No employees match "' + term + '".'
      : 'No employees yet. Click "Add employee" to add one.';
    $rows.empty().append($('<tr class="empty">').append($('<td colspan="5">').text(message)));
  }

  // ---- Search ----
  const $searchForm = $("#search-form");
  const $search = $("#search");
  let searchTimer = null;
  let searchRequest = null;

  function employeeRow(employee) {
    const $tr = $("<tr>").attr("data-id", employee.id);
    $("<td>").text(employee.name).appendTo($tr);
    $("<td>").text(employee.designation).appendTo($tr);
    $("<td>").text(employee.age).appendTo($tr);
    $("<td>").text(Number(employee.salary).toFixed(2)).appendTo($tr);
    $("<td class='row-actions'>")
      .append(
        $("<a class='btn secondary btn-edit'>Edit</a>")
          .attr("href", $table.data("editUrl").replace("0", String(employee.id)))
      )
      .append("<button type='button' class='btn danger btn-delete'>Delete</button>")
      .appendTo($tr);
    return $tr;
  }

  function renderRows(employees) {
    $rows.empty();
    $.each(employees, function (_, employee) {
      $rows.append(employeeRow(employee));
    });
    showEmptyIfNeeded();
  }

  // Search employees by name with AJAX and redraw the table
  function searchEmployees() {
    const term = $.trim($search.val());

    // Keep the search in the URL, so a refresh or the back button keeps it
    const url = term ? "?search=" + encodeURIComponent(term) : location.pathname;
    history.replaceState(null, "", url);

    // Cancel an older request that is still running, so results never arrive out of order
    if (searchRequest) {
      searchRequest.abort();
    }

    searchRequest = $.ajax({
      url: $searchForm.attr("action"),
      type: "GET",
      data: { search: term },
      dataType: "json",
      headers: { "X-Requested-With": "XMLHttpRequest" }
    })
      .done(renderRows)
      .fail(function (xhr, textStatus) {
        if (textStatus !== "abort") {
          showStatus("Could not load employees.", true);
        }
      });
  }

  // Search while typing, waiting until the user pauses for 300 ms
  $search.on("input", function () {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(searchEmployees, 300);
  });

  // Enter searches right away instead of reloading the page
  $searchForm.on("submit", function (event) {
    event.preventDefault();
    clearTimeout(searchTimer);
    searchEmployees();
  });

  // Delete: remove the employee on the server and from the table
  function deleteEmployee(id) {
    if (!confirm("Delete this employee?")) {
      return;
    }

    $.ajax({
      url: $table.data("deleteUrl").replace("0", String(id)),
      type: "POST",
      data: { __RequestVerificationToken: token },
      dataType: "json",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        RequestVerificationToken: token
      }
    })
      .done(function () {
        $rows.find('tr[data-id="' + id + '"]').remove();
        showEmptyIfNeeded();
        showStatus("Employee deleted.");
      })
      .fail(function () {
        showStatus("Could not delete employee.", true);
      });
  }

  $rows.on("click", ".btn-delete", function () {
    deleteEmployee($(this).closest("tr").data("id"));
  });
});
