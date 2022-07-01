const pen = document.querySelectorAll('.fa-pen-to-square');
const trash = document.querySelectorAll('.fa-trash');
const update = document.querySelectorAll('#update-button');
const search = document.querySelector('#search');
const fileUploader = document.querySelector('#fileUploader');
const upload = document.querySelector('#upload-button');
const download = document.querySelector('#download-button');
const sortFloor = document.querySelector('#sort-floor');

sortFloor.addEventListener('click', (evt) => {
  if (!sortFloor.ariaSort || sortFloor.ariaSort === 'descending') {
    sortFloor.ariaSort = 'ascending';
    sortValue = 1;
  } else if (sortFloor.ariaSort === 'ascending') {
    sortFloor.ariaSort = 'descending';
    sortValue = -1;
  }
  // fetch('/', {
  //   method: 'get',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     sort: sortValue,
  //   }),
  // })
  //   .then((res) => {
  //     if (res.ok) return res.json();
  //   })
  //   .then((response) => {
  //     window.location.reload(true);
  //   });
});

pen.forEach((e) => {
  e.addEventListener('click', (event) => {
    const form = event.target.parentElement.parentElement.nextElementSibling;
    form.classList.toggle('hidden');
    form.classList.toggle('tr');
  });
});

update.forEach((e) => {
  e.addEventListener('click', (evt) => {
    evt.preventDefault();
    const firstName =
      evt.target.parentElement.parentElement.previousElementSibling.children[0]
        .textContent;
    const lastName =
      evt.target.parentElement.parentElement.previousElementSibling.children[1]
        .textContent;
    const floor =
      evt.target.parentElement.parentElement.previousElementSibling.children[2]
        .textContent;
    const admin =
      evt.target.parentElement.parentElement.previousElementSibling.children[3]
        .textContent;
    const originalData = {
      'first-name': firstName,
      'last-name': lastName,
      floor: floor,
      admin: admin,
    };
    const form = evt.target.parentElement.parentElement;
    const formData = [...new FormData(form)].reduce((o, [k, v]) => {
      o[k] = v;
      return o;
    }, {});
    fetch('/employees/update', {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalData: originalData,
        formData: formData,
      }),
    })
      .then((res) => {
        if (res.ok) return res.json();
      })
      .then((response) => {
        window.location.reload(true);
      });
  });
});

trash.forEach((e) =>
  e.addEventListener('click', (event) => {
    event.preventDefault();
    const firstName =
      event.target.parentElement.parentElement.children[0].textContent;
    const lastName =
      event.target.parentElement.parentElement.children[1].textContent;
    fetch('/employees', {
      method: 'delete',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'first-name': firstName,
        'last-name': lastName,
      }),
    }).then((response) => window.location.reload(true));
  })
);

// Upload from excel
let json_object;
document.addEventListener(
  'DOMContentLoaded',
  function () {
    fileUploader.addEventListener('change', (event) => {
      var selectedFile = event.target.files[0];
      var reader = new FileReader();
      reader.onload = function (event) {
        var data = event.target.result;
        var workbook = XLSX.read(data, {
          type: 'binary',
        });
        workbook.SheetNames.forEach(function (sheetName) {
          var XL_row_object = XLSX.utils.sheet_to_row_object_array(
            workbook.Sheets[sheetName]
          );
          json_object = JSON.stringify(XL_row_object);
          document.querySelector('#jsonObject').innerHTML = json_object;
          if (json_object.length) {
            upload.classList.toggle('hidden');
          }
        });
      };

      reader.onerror = function (event) {
        console.error(
          'File could not be read! Code ' + event.target.error.code
        );
      };

      reader.readAsBinaryString(selectedFile);
    });
  },
  false
);

upload.addEventListener('click', (_) => {
  fetch('/employees/upload', {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: json_object,
  })
    .then((res) => {
      if (res.ok) return res.json();
    })
    .then((response) => {
      window.location.reload(true);
    });
});

// download xlsx
download.addEventListener('click', async () => {
  const xlsx = await fetch('/employees/download');
  const xlsxBlob = await xlsx.blob();
  const xlsxURL = URL.createObjectURL(xlsxBlob);

  const anchor = document.createElement('a');
  anchor.href = xlsxURL;
  anchor.download = 'Employees.xlsx';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(xlsxURL);
});
