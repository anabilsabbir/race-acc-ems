// Used by both the Add employee page and the Edit employee page.
$(function () {
  const $form = $("#employee-form");
  const $status = $("#status");
  const $save = $("#save");
  const token = $form.find('input[name="__RequestVerificationToken"]').val();

  function clearErrors() {
    $form.find(".field-error").text("");
    $status.prop("hidden", true);
  }

  function showErrors(errors) {
    $.each(errors || {}, function (field, messages) {
      $form.find('[data-valmsg-for="' + field + '"]').text(messages.join(" "));
    });
  }

  // Save the employee with AJAX (create or update, depending on the form's action),
  // then go back to the list page
  function saveEmployee() {
    clearErrors();
    $save.prop("disabled", true);

    $.ajax({
      url: $form.attr("action"),
      type: "POST",
      data: $form.serialize(),
      dataType: "json",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        RequestVerificationToken: token
      }
    })
      .done(function () {
        window.location.href = $form.data("indexUrl");
      })
      .fail(function (xhr) {
        showErrors(xhr.responseJSON && xhr.responseJSON.errors);
        $status.text("Could not save. Check name, designation, age (16-100), and salary.").prop("hidden", false);
        $save.prop("disabled", false);
      });
  }

  $form.on("submit", function (event) {
    event.preventDefault();
    saveEmployee();
  });

  $("#Name").trigger("focus");
});
