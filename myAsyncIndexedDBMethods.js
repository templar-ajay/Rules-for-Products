function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("database", 1);

    request.onerror = (e) => {
      reject(e.target.error);
    };

    request.onsuccess = (e) => {
      resolve(e.target.result);
    };

    request.onupgradeneeded = (e) => {
      const db = e.target.result || request.result;

      const objectStore = db.createObjectStore("rules", { keyPath: "master" });

      objectStore.transaction.oncomplete = (e) => {
        console.log("Object store created successfully");
      };
    };
  });
}

async function addData(data) {
  if (!window.db) window.db = await openDB();

  const objectStore = db
    .transaction(["rules"], "readwrite")
    .objectStore("rules");

  const request = objectStore.add(data);

  request.onsuccess = (e) => {
    console.log(data, `added to the Object Store`);
  };
  request.onerror = (e) => {
    console.log(`Error loading database ${e.target.error}`);
  };
}

async function getData(
  key /* used to delete the item , leave empty if you just need to get items */
) {
  if (!window.db) window.db = await openDB();
  return new Promise((resolve, reject) => {
    const objectStore = db
      .transaction("rules", "readwrite")
      .objectStore("rules");

    const request = objectStore.openCursor();

    request.onerror = (e) => {
      console.log(reject(e.target.error));
    };
    const arr = [];
    request.onsuccess = (e) => {
      const cursor = e.target.result;

      cursor
        ? (cursor.value.master === key
            ? (cursor.delete(),
              console.log(`successfully deleted ${cursor.value.master}`))
            : arr.push(cursor.value),
          cursor.continue())
        : (resolve(arr),
          console.log(`cursor reached then end of rules in database `));
    };
  });
}

async function updateData(keyPath, key, value) {
  if (!window.db) window.db = await openDB();
  const objectStore = db.transaction("rules", "readwrite").objectStore("rules");

  const request = objectStore.get(keyPath);

  request.onerror = (e) => {
    console.log(`Error !! while opening cursor on `);
  };

  request.onsuccess = (e) => {
    const data = e.target.result;
    console.log(`data`, data);
    data[key] = value;

    const updateRequest = objectStore.put(data);
    updateRequest.onerror = (e) => {
      console.log(`failed to put data - Error !! ${e.target.error}`);
    };

    updateRequest.onsuccess = (e) => {
      console.log(value, ` updated successfully in childProducts`);
    };
  };
}

function deleteData(key) {
  getData(key);
}
export { openDB, addData, getData, updateData, deleteData };
