
(() => {
  loadScript()
  function loadScript() {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.querySelector("#rulesPage")) {
        MAIN_OBJ.INIT();
      }
      if (document.querySelector("#productsPage")) {
        MASTER_PRODUCT_OBJ.INIT();
        CHILD_PRODUCTS_OBJ.INIT();
      }
    })
  }

  const COOKIES = {

    checkForCookies: function () {
      document.cookie
        ?.split(";")
        .find((item) => {
          return item.includes("failedProduct");
        })
        ?.split("=")[1]
        .split(",")
        .forEach((failedProduct) => {
          MAIN_OBJ.failedProducts.push(failedProduct);
        });

      MAIN_OBJ.failedProducts?.forEach((failedProduct, index) => {
        MAIN_OBJ.productHandles.splice(MAIN_OBJ.productHandles.indexOf(failedProduct), 1);
      });
    },
    crossCheckIfProductIsAvailable: function () {
      if (!MAIN_OBJ.failedProducts?.length) return true;

      const succeeded = [];
      MAIN_OBJ.failedProducts.forEach((failedProduct) => {
        MAIN_OBJ.getApi(`${MAIN_OBJ.baseUrl + failedProduct}.json`).then((json) => {
          json
            ? (succeeded.push(failedProduct), MAIN_OBJ.productHandles.push(failedProduct))
            : null;
        });
      });
      succeeded.forEach((product) => {
        MAIN_OBJ.failedProducts.splice(MAIN_OBJ.failedProducts.indexOf(product), 1);
      });
      MAIN_OBJ.failedProducts.length
        ? COOKIES.updateCookie("failedProduct", MAIN_OBJ.failedProducts.join(","))
        : COOKIES.clearCookie("failedProduct");

      return false;
    },
    clearCookie: function (name) {
      document.cookie = name + `= ;expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
    },
    updateCookie: function (name, value) {
      document.cookie = `${name}=${value};Max-Age=86400; SameSite=Strict; Secure`;
    },

    // checkCookieForBadProduct: function () {
    //   return new Promise((resolve, reject) => {
    //     document.cookie.split(";").some((item) => {
    //       return item.includes("failedProduct");
    //     })
    //       ? resolve(document.cookie?.split("=")[1]?.split(","))
    //       : reject();
    //   });
    // }
  };
  const DB_METHODS = {
    openDB: function () {
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
            // console.log("Object store created successfully");
          };
        };
      });
    },
    addData: async function (data) {
      if (!MAIN_OBJ.db) MAIN_OBJ.db = await DB_METHODS.openDB();

      const objectStore = MAIN_OBJ.db
        .transaction(["rules"], "readwrite")
        .objectStore("rules");

      const request = objectStore.add(data);

      request.onsuccess = (e) => {
        // console.log(data, `added to the Object Store`);
      };
      request.onerror = (e) => {
        console.log(`Error loading database ${e.target.error}`);
      };
    },
    getData: async function (
      key /* used to delete the item , leave empty if you just need to get items */
    ) {
      if (!MAIN_OBJ.db) MAIN_OBJ.db = await DB_METHODS.openDB();
      return new Promise((resolve, reject) => {
        const objectStore = MAIN_OBJ.db
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
              ? (cursor.delete()
                // ,console.log(`successfully deleted ${cursor.value.master}`)
              )
              : arr.push(cursor.value),
              cursor.continue())
            : (resolve(arr)
              // ,console.log(`cursor reached then end of rules in database `)
            );
        };
      });
    },
    updateData: async function (keyPath, key, value) {
      if (!MAIN_OBJ.db) MAIN_OBJ.db = await DB_METHODS.openDB();
      const objectStore = MAIN_OBJ.db.transaction("rules", "readwrite").objectStore("rules");

      const request = objectStore.get(keyPath);

      request.onerror = (e) => {
        console.log(`Error !! while opening cursor on `);
      };

      request.onsuccess = (e) => {
        const data = e.target.result;
        // console.log(`data`, data);
        data[key] = value;

        const updateRequest = objectStore.put(data);
        updateRequest.onerror = (e) => {
          console.log(`failed to put data - Error !! ${e.target.error}`);
        };

        updateRequest.onsuccess = (e) => {
          // console.log(value, ` updated successfully in childProducts`);
        };
      };
    },
    deleteData: function (key) {
      DB_METHODS.getData(key);
    }
  }

  const MAIN_OBJ = {
    INIT: async () => {
      COOKIES.checkForCookies(); // cookie validation
      MAIN_OBJ.cookiesEmpty = COOKIES.crossCheckIfProductIsAvailable();

      // declaring constants
      // MAIN_OBJ.container = document.getElementById("container");
      MAIN_OBJ.makeRuleBtn = document.getElementById("make-rule");
      MAIN_OBJ.currentRuleEntries = {};
      MAIN_OBJ.remainingSetOfProductHandles = new Set();

      // opening the indexedDB database
      MAIN_OBJ.db = await DB_METHODS.openDB().catch((err) => { });
      MAIN_OBJ.remakeRemainingSetOfProductHandles();

      if (!MAIN_OBJ.db) MAIN_OBJ.db = await DB_METHODS.openDB();
      (await MAIN_OBJ.loadListOfRules())
        ? (MAIN_OBJ.showListOfRulesCard(true),
          MAIN_OBJ.removeMasterProductsFromRemainingSetOfProductHandles())
        : null;

      MAIN_OBJ.makeRuleBtn.addEventListener("click", () => {
        MAIN_OBJ.showMakeRule(true);
        const masterInput = document.querySelector("#master-input");
        const childInput = document.querySelector("#child-input");
        const addRuleBtn = document.querySelector("#add-rule");
        const discardRuleBtn = document.querySelector("#discard-rule");

        masterInput.addEventListener("click", function (e) {
          MAIN_OBJ.showErrorInInput(false);
          MAIN_OBJ.autocomplete(masterInput, MAIN_OBJ.remainingSetOfProductHandles);
        });

        childInput.addEventListener("click", function (e) {
          MAIN_OBJ.showErrorInInput(false);
          MAIN_OBJ.autocomplete(childInput, MAIN_OBJ.remainingSetOfProductHandles);
        });

        addRuleBtn.addEventListener("click", () => {
          // if (!entriesCheck()) return; // exit function if it fails entry check

          MAIN_OBJ.addRule()
            ? (MAIN_OBJ.showListOfRulesCard(true, true), //  shows list of added rules
              MAIN_OBJ.loadListOfRules(),
              MAIN_OBJ.showMakeRule(), // deletes make rule card
              MAIN_OBJ.remakeRemainingSetOfProductHandles(),
              MAIN_OBJ.removeMasterProductsFromRemainingSetOfProductHandles(),
              (MAIN_OBJ.makeRuleBtn.style.display = ""))
            : null;
        });

        discardRuleBtn.addEventListener("click", () => {
          MAIN_OBJ.showMakeRule(); // deletes make rule card
          MAIN_OBJ.remakeRemainingSetOfProductHandles();
          MAIN_OBJ.removeMasterProductsFromRemainingSetOfProductHandles();
          MAIN_OBJ.makeRuleBtn.style.display = "";
        });
      });
      // #######################################################################
      MAIN_OBJ.objectFromAPIs = await MAIN_OBJ.foo();
      sessionStorage.setItem("objectFromAPIs", JSON.stringify(MAIN_OBJ.objectFromAPIs));
      document.querySelectorAll(".disabled")?.forEach((button) => {
        button.classList.remove("disabled");
      });

      // #######################################################################
    },
    baseUrl: "https://afzal-test-shop.myshopify.com/products/",
    productHandles: [
      "women-jacketsingle-product-1",
      "shoes",
      "fake-product",
      "apple-iphone-11-128gb-white-includes-earpods-power-adapter",
      "arista-variant-images-test",
      "leather-cover",
      "the-hoxton-clutch-in-plastic-4",
      "short_video_product",
      "shirt_with_video",
      "shirt_with_video",
    ],
    failedProducts: [],

    makeRuleInnerHTMl: `
    <form autocomplete="off">
      <div class="card p-3">
        <div class="autocomplete">
          <label for = "master-input" >Master Product</label>
          <div class=" input-group mb-3" id ="master-input-div">
            <input id="master-input" type="text" name="myCountry" class="form-control" placeholder="enter the handle of master product here" style="width:max-content" >
          </div>
        </div>

        <div class="autocomplete">
          <label for ="child-input">Child Products</label>
            <div class="input-group mb-3" id ="child-input-div">
              <input type="text" id = "child-input" name="myCountry" autocomplete="off" class="form-control" placeholder="enter the handles of child products here" style="width:max-content ">
            </div>
        </div>
          
        <div class="d-flex">
            <btn id="add-rule" class="btn btn-outline-success" style="width:150px ;" >Add Rule</btn>
            <btn id="discard-rule" autocomplete="off" class = "btn btn-outline-secondary mx-2" style="width: 150px;" >Discard</btn>
        </div>
      </div>
    </form>`,
    getApi: async function (givenUrl) {
      try {
        const response = await fetch(givenUrl);
        const data = await response.json();
        return data;
      } catch (err) {
        console.log(`failed to load data from ${givenUrl}`);
      }
    },
    foo: async function () {
      const obj = {};
      for (let i = 0; i < MAIN_OBJ.productHandles.length; i++) {
        const js = await MAIN_OBJ.getApi(`${MAIN_OBJ.baseUrl + MAIN_OBJ.productHandles[i]}.js`);
        const json = await MAIN_OBJ.getApi(`${MAIN_OBJ.baseUrl + MAIN_OBJ.productHandles[i]}.json`);

        js && json
          ? (obj[MAIN_OBJ.productHandles[i]] = [js, json])
          : (console.log(
            `failed to fetch data of product ${MAIN_OBJ.productHandles[i]}, removing it from products array`
          ),
            MAIN_OBJ.failedProducts.push(MAIN_OBJ.productHandles[i]));
      }
      COOKIES.updateCookie("failedProduct", MAIN_OBJ.failedProducts.join(","));
      MAIN_OBJ.failedProducts.forEach((failedProduct) => {
        MAIN_OBJ.productHandles.splice(MAIN_OBJ.productHandles.indexOf(failedProduct), 1);
      });

      MAIN_OBJ.cookiesEmpty
        ? window.confirm(
          "some error occurred while fetching products , we are refreshing the Page"
        )
          ? window.location.reload()
          : window.location.reload()
        : null;
      return obj;
    },
    autocomplete: function (inp, set) {
      /*the autocomplete function takes two arguments,
      the text field element and an array of possible autocompleted values:*/
      let currentFocus;
      x();
      /*execute a function when someone writes in the text field:*/
      inp.addEventListener("input", x);
      function x() {
        let a,
          b,
          i,
          val = inp.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", inp.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        inp.parentNode.parentNode.appendChild(a);
        /*for each item in the array...*/
        for (const value of set) {
          /*check if the item starts with the same letters as the text field value:*/

          if (value.substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            /*create a DIV element for each matching element:*/
            b = document.createElement("DIV");
            /*make the matching letters bold:*/
            b.innerHTML = "<strong>" + value.substr(0, val.length) + "</strong>";
            b.innerHTML += value.substr(val.length);
            /*insert a input field that will hold the current array item's value:*/
            b.innerHTML += "<input type='hidden' value='" + value + "'>";
            /*execute a function when someone clicks on the item value (DIV element):*/
            b.addEventListener("click", function (e) {
              /*insert the value for the autocomplete text field:*/
              inp.value = "";
              MAIN_OBJ.addSelection(
                inp.parentElement,
                inp,
                this.getElementsByTagName("input")[0].value
              );
              MAIN_OBJ.changeInputs();
              // inp.value = this.getElementsByTagName("input")[0].value;
              /*close the list of autocompleted values,
                  (or any other open lists of autocompleted values:*/
              closeAllLists();
            });
            a.appendChild(b);
          }
        }
      }
      /*execute a function presses a key on the keyboard:*/
      inp.addEventListener("keydown", function (e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) {
          /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
          currentFocus++;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 38) {
          //up
          /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
          currentFocus--;
          /*and and make the current item more visible:*/
          addActive(x);
        } else if (e.keyCode == 13) {
          /*If the ENTER key is pressed, prevent the form from being submitted,*/
          e.preventDefault();
          if (currentFocus > -1) {
            /*and simulate a click on the "active" item:*/
            if (x) x[currentFocus].click();
          }
        }
      });
      function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = x.length - 1;
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
      }
      function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (let i = 0; i < x.length; i++) {
          x[i].classList.remove("autocomplete-active");
        }
      }
      function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
          if (elmnt != x[i] && elmnt != inp) {
            x[i].parentNode.removeChild(x[i]);
          }
        }
      }

      /*execute a function when someone clicks in the document:*/
      document.addEventListener("click", function (e) {
        if (e.target.id == "master-input") {
        } else if (e.target.id == "child-input") {
        } else closeAllLists(e.target);
      });
    },
    addSelection: function (parentDiv, addBefore, selectionText, isNonRemovable) {
      parentDiv.insertBefore(createBtn(), addBefore);
      function createBtn() {
        const btn = document.createElement("btn");
        btn.className = "btn btn-outline-primary";
        btn.type = "button";
        const span = document.createElement("span");
        span.innerHTML = selectionText;
        MAIN_OBJ.updateRemainingSetOfProductHandles("delete", selectionText);

        btn.appendChild(span);
        btn.style.width = isNonRemovable ? "max-content" : "200px";
        btn.classList += " text-nowrap";
        btn.classList += isNonRemovable ? " non-removable" : " removable";
        if (isNonRemovable) {
        } else {
          btn.addEventListener("click", MAIN_OBJ.removeBtn);
        }
        return btn;
      }
      if (addBefore.id == "master-input") {
        MAIN_OBJ.currentRuleEntries["masterProduct"] = selectionText;
      } else if (addBefore.id == "child-input") {
        (
          MAIN_OBJ.currentRuleEntries["childProducts"] ||
          (MAIN_OBJ.currentRuleEntries["childProducts"] = [])
        ).push(selectionText);
      }
    },
    removeBtn: function (e) {
      // console.log(`removing ${e.target.childNodes[0].innerHTML}`);
      MAIN_OBJ.updateRemainingSetOfProductHandles("add", e.target.childNodes[0].innerHTML);

      MAIN_OBJ.updateCurrentSelectionChildProductSet(
        "splice",
        e.target.childNodes[0].innerHTML
      );

      e.target.remove();
      MAIN_OBJ.changeInputs();
      MAIN_OBJ.checkIfChildProductsEmpty();
    },
    showMakeRule: function (x) {
      const makeRuleCard = document.querySelector("#make-rule-card");
      x
        ? (makeRuleCard.innerHTML = MAIN_OBJ.makeRuleInnerHTMl)
        : (makeRuleCard.innerHTML = "");
    },
    showListOfRulesCard: function (x, force) {
      const listOfRulesCard = document.querySelector("#list-of-rules-card");
      const listOfRulesEl = document.querySelector("#list-of-rules");
      listOfRulesEl.innerHTML == "" && !force
        ? null
        : x
          ? (listOfRulesCard.style.display = "block")
          : (listOfRulesCard.style.display = "none");
    },
    changeInputs: function () {
      let set;
      const masterInput = document.getElementById("master-input");
      const childInput = document.getElementById("child-input");
      if (masterInput.parentElement.childNodes.length > 3) {
        masterInput.disabled = "true";
        masterInput.placeholder = "is the master Product";
      } else {
        masterInput.disabled = "";
        masterInput.placeholder = "enter the handle of master product here";
      }
      if (
        (set = new Set(MAIN_OBJ.remainingSetOfProductHandles)).size <
        (masterInput.parentElement.childNodes.length > 3 ? 1 : 2)
      ) {
        childInput.disabled = "true";
        childInput.placeholder = "are the child products";
      } else {
        childInput.disabled = "";
        childInput.placeholder = "enter the handles of child products here";
      }
    },
    updateRemainingSetOfProductHandles: function (method, value) {
      MAIN_OBJ.remainingSetOfProductHandles[method](value);
    },
    remakeRemainingSetOfProductHandles: function () {
      MAIN_OBJ.productHandles.forEach((value) => MAIN_OBJ.remainingSetOfProductHandles.add(value));
    },
    addRule: async function () {
      if (MAIN_OBJ.entriesCheck()) {
        // perform crud operation in local storage

        const ArrayOfRules = await DB_METHODS.getData();

        const rule = {
          master: MAIN_OBJ.currentRuleEntries.masterProduct,
          childProducts: MAIN_OBJ.currentRuleEntries.childProducts,
        };
        DB_METHODS.addData(rule);

        // DB_METHODS.updateData(
        //   currentRuleEntries.masterProduct,
        //   "childProducts",
        //   currentRuleEntries.childProducts
        // );
        // old code
        // ArrayOfRules[currentRuleEntries.masterProduct] = Array.from(
        //   currentRuleEntries.childProducts
        // );

        // sessionStorage.setItem("rules", JSON.stringify(ArrayOfRules));

        MAIN_OBJ.resetCurrentRuleEntriesObject();

        await DB_METHODS.getData();
        MAIN_OBJ.loadListOfRules();
        return true;
      } else {
        MAIN_OBJ.showErrorInInput(true);
        return false;
      }
    },
    loadListOfRules: async function () {
      const ArrayOfRules = await DB_METHODS.getData();
      const listOfRulesEl = document.querySelector("#list-of-rules");
      listOfRulesEl.innerHTML = "";

      ArrayOfRules.forEach((obj, index) => {
        const li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between ";
        li.style.width = "100%";
        li.innerHTML = `<b class = "my-3"> ${obj.master} </b>`; // Note -  here we will use value now

        const span = document.createElement("span");

        span.appendChild(MAIN_OBJ.createBtn(obj.master, "Preview", "primary"));
        span.appendChild(MAIN_OBJ.createBtn(obj.master, "Edit-Rule", "warning"));
        span.appendChild(MAIN_OBJ.createBtn(obj.master, "Delete", "danger"));

        li.appendChild(span);
        listOfRulesEl.appendChild(li);
      });

      return await ArrayOfRules.length; // returns false if object is empty;
    },
    entriesCheck: function () {
      const masterInput = document.querySelector("#master-input");
      const childInput = document.querySelector("#child-input");
      if (
        masterInput.parentElement.childNodes.length > 3 &&
        childInput.parentElement.childNodes.length > 3
      )
        return true;
      else return false;
    },
    resetCurrentRuleEntriesObject: function () {
      MAIN_OBJ.currentRuleEntries.masterProduct = "";
      MAIN_OBJ.currentRuleEntries.childProducts = [];
    },
    removeMasterProductsFromRemainingSetOfProductHandles: function () {
      // To remove master products from Set of remaining products
      DB_METHODS.getData()
        .then((ArrayOfRules) => {
          ArrayOfRules.forEach((obj) => {
            MAIN_OBJ.remainingSetOfProductHandles.delete(obj.master);
          });
        })
        .catch((err) => console.log(`err`, err));
    },
    showErrorInInput: function (x) {
      const masterInput = document.querySelector("#master-input");
      const childInput = document.querySelector("#child-input");

      const y = MAIN_OBJ.remainingSetOfProductHandles.size > 2;

      if (masterInput.parentElement.childNodes.length < 4) {
        masterInput.placeholder = x
          ? y
            ? "PLEASE SELECT ONE MASTER PRODUCT"
            : "CANNOT MAKE A RULE WITH JUST ONE PRODUCT - PLEASE DISCARD"
          : "enter the handle of master product here";

        x
          ? (masterInput.classList += " bg-warning")
          : masterInput.classList.remove("bg-warning");
      }

      if (childInput.parentElement.childNodes.length < 4) {
        childInput.placeholder = x
          ? y
            ? "PLEASE SELECT ONE CHILD PRODUCT"
            : "CANNOT MAKE A RULE WITH JUST ONE PRODUCT - PLEASE DISCARD"
          : "enter the handles of child products here";
        x
          ? (childInput.classList += " bg-warning")
          : childInput.classList.remove("bg-warning");
      }
    },
    createBtn: function (id, type, color) {
      const button = document.createElement("button");
      button.className = `btn ${type === "Delete" ? `btn-outline-${color}` : `btn-${color}`
        } ${type == "Preview" && !JSON.parse(sessionStorage.getItem("objectFromAPIs"))
          ? "disabled"
          : null
        } mx-2 my-2`;
      button.id = `${id}-${type}-btn`;
      button.innerHTML = type[0].toUpperCase() + type.slice(1);
      button.addEventListener("click", (e) => {
        type == "Preview"
          ? MAIN_OBJ.onViewBtnClick(id)
          : type == "Edit-Rule"
            ? MAIN_OBJ.onEditBtnClick(id)
            : type == "Delete"
              ? MAIN_OBJ.onDeleteBtnClick(id)
              : null;
      });
      return button;
    },
    onViewBtnClick: async function (id) {
      const rules = await DB_METHODS.getData();
      rules.forEach((rule) => {
        DB_METHODS.updateData(rule.master, "currentRule", false);
      });
      const theRule = rules.filter((rule) => rule.master === id)[0];
      DB_METHODS.updateData(id, "currentRule", true);

      window.open("./products-page/index.html");
    },
    onEditBtnClick: async function (id) {
      MAIN_OBJ.loadCurrentRuleEntries();
      MAIN_OBJ.showListOfRulesCard();
      MAIN_OBJ.showMakeRule(true);
      const updateRuleBtn = document.querySelector("#add-rule");
      updateRuleBtn.innerHTML = "Update Rule";
      const masterInput = document.querySelector("#master-input");
      MAIN_OBJ.addSelection(masterInput.parentElement, masterInput, id, true);
      const childInput = document.querySelector("#child-input");
      const rules = await DB_METHODS.getData();
      const theRule = rules.filter((rule) => {
        return rule.master === id;
      });
      theRule[0].childProducts.forEach((selectionText) => {
        MAIN_OBJ.addSelection(childInput.parentElement, childInput, selectionText, false);
      });
      // rules[id].forEach((childHandle) => {
      //   remainingSetOfProductHandles.delete(childHandle);
      // });
      childInput.addEventListener("click", () => {
        MAIN_OBJ.autocomplete(childInput, MAIN_OBJ.remainingSetOfProductHandles);
      });
      MAIN_OBJ.changeInputs();

      updateRuleBtn.addEventListener("click", async () => {
        const rulesObj = await DB_METHODS.getData();
        const theRule = rulesObj.filter((rule) => rule.master === id)[0];
        theRule.childProducts = MAIN_OBJ.currentRuleEntries.childProducts;

        DB_METHODS.updateData(theRule.master, "childProducts", theRule.childProducts);

        MAIN_OBJ.remakeRemainingSetOfProductHandles();
        MAIN_OBJ.removeMasterProductsFromRemainingSetOfProductHandles();
        MAIN_OBJ.resetCurrentRuleEntriesObject();

        MAIN_OBJ.showMakeRule(); //hides make rules card
        MAIN_OBJ.showListOfRulesCard(true);
        MAIN_OBJ.makeRuleBtn.style.display = "";
      });
      const discardRuleBtn = document.querySelector("#discard-rule");
      discardRuleBtn.addEventListener("click", () => {
        // const nonUsedHandles = extractNonUsedHandles(
        //   currentRuleEntries.childProducts,
        //   JSON.parse(sessionStorage.getItem("rules"))[id]
        // ); // nonUsedHandles =  the handles that were taken out from the remainingSetOfProductHandles on addSelection()
        // nonUsedHandles.forEach((handle) =>
        //   updateRemainingSetOfProductHandles("add", handle)
        // ); // adds them back to remainingSetOfProductHandles , as the changes are being discarded.

        MAIN_OBJ.remakeRemainingSetOfProductHandles();
        MAIN_OBJ.removeMasterProductsFromRemainingSetOfProductHandles();
        MAIN_OBJ.resetCurrentRuleEntriesObject();
        MAIN_OBJ.showMakeRule();
        MAIN_OBJ.showListOfRulesCard(true);
        MAIN_OBJ.makeRuleBtn.style.display = "";
      });
      MAIN_OBJ.makeRuleBtn.style.display = "none";
    },
    updateCurrentSelectionChildProductSet: function (method, value) {
      MAIN_OBJ.currentRuleEntries.childProducts[method](
        MAIN_OBJ.currentRuleEntries.childProducts.indexOf(value),
        1
      );
    },
    loadCurrentRuleEntries: async function (id) {
      MAIN_OBJ.currentRuleEntries.masterProduct = id;
      const rules = await DB_METHODS.getData();
      const theRule = rules.filter((rule) => (rule.master === id ? true : false));
      MAIN_OBJ.currentRuleEntries.childProducts = theRule.childProducts;
    },
    onDeleteBtnClick: async function (id) {
      // const rules = await DB_METHODS.getData();
      // const theRule = rules.filter((rule) => rule.master === id)[0];
      // // delete rulesObj[id];

      DB_METHODS.deleteData(id);

      MAIN_OBJ.loadListOfRules();
      MAIN_OBJ.remakeRemainingSetOfProductHandles();
      MAIN_OBJ.removeMasterProductsFromRemainingSetOfProductHandles();
    },
    checkIfChildProductsEmpty: function () {
      MAIN_OBJ.currentRuleEntries.childProducts.length < 1
        ? (MAIN_OBJ.onDeleteBtnClick(MAIN_OBJ.currentRuleEntries.masterProduct),
          MAIN_OBJ.showMakeRule(),
          MAIN_OBJ.loadListOfRules(),
          MAIN_OBJ.showListOfRulesCard(true),
          (MAIN_OBJ.makeRuleBtn.style.display = ""))
        : null;
    },


  };
  const MASTER_PRODUCT_OBJ = {
    INIT: async function () {
      MASTER_PRODUCT_OBJ.objectFromAPIs = JSON.parse(sessionStorage.getItem("objectFromAPIs"));
      MASTER_PRODUCT_OBJ.rule = (await DB_METHODS.getData()).filter((rule) => rule.currentRule === true)[0];
      MASTER_PRODUCT_OBJ.masterProduct = MASTER_PRODUCT_OBJ.rule.master;
      MASTER_PRODUCT_OBJ.js = MASTER_PRODUCT_OBJ.objectFromAPIs[MASTER_PRODUCT_OBJ.masterProduct][0];
      MASTER_PRODUCT_OBJ.jsonData = MASTER_PRODUCT_OBJ.objectFromAPIs[MASTER_PRODUCT_OBJ.masterProduct][1];
      MASTER_PRODUCT_OBJ.bigImage = document.getElementById("big-img");
      MASTER_PRODUCT_OBJ.bigVideo = document.getElementById("big-video");
      MASTER_PRODUCT_OBJ.smallImagesRow = document.getElementsByClassName("x-small-img-row")[0];
      MASTER_PRODUCT_OBJ.title = document.getElementById("title");
      MASTER_PRODUCT_OBJ.description = document.getElementById("description");
      MASTER_PRODUCT_OBJ.price = document.getElementById("price");
      MASTER_PRODUCT_OBJ.comparedPrice = document.getElementById("compared-price");
      MASTER_PRODUCT_OBJ.addToCartBtn = document.querySelector("a.x-btn");
      MASTER_PRODUCT_OBJ.variantsDiv = document.querySelector("#variants");

      MASTER_PRODUCT_OBJ.loadStaticData();

      MASTER_PRODUCT_OBJ.sortedImageObj = MASTER_PRODUCT_OBJ.createImageObj(MASTER_PRODUCT_OBJ.jsonData);
      console.log(`sortedImageObj`, MASTER_PRODUCT_OBJ.sortedImageObj);

      MASTER_PRODUCT_OBJ.selectedOptions = {};

      MASTER_PRODUCT_OBJ.js.options?.forEach((option) => {
        MASTER_PRODUCT_OBJ.selectedOptions[option.name] = option.values[0];
        MASTER_PRODUCT_OBJ.loadDynamicContent();
      });

      MASTER_PRODUCT_OBJ.loadOptionsDom();

      MASTER_PRODUCT_OBJ.onClickBtnChangeFunctionality();

      document.addEventListener("keydown", (e) => {
        if (e.altKey && e.key == "p") MASTER_PRODUCT_OBJ.changeColorVariantBtnStyle();
      });

      MASTER_PRODUCT_OBJ.changeColorVariantBtnStyle = MASTER_PRODUCT_OBJ.foo();

      MASTER_PRODUCT_OBJ.buyingLimit(4);

    },
    loadDynamicContent: function () {
      // load small images from our MASTER_PRODUCT_OBJ.sortedImageObj ,load price , compared price,
      // also changes big image according to small images
      MASTER_PRODUCT_OBJ.loadSmallImages(MASTER_PRODUCT_OBJ.getVariantID().variantIDforImg);
      MASTER_PRODUCT_OBJ.loadPrices(MASTER_PRODUCT_OBJ.getVariantID().variantID);
      MASTER_PRODUCT_OBJ.loadBigImage();
      MASTER_PRODUCT_OBJ.loadMedia();
    },
    onClickBtnChangeFunctionality: function () {
      MASTER_PRODUCT_OBJ.variantBtnColorChange();
      MASTER_PRODUCT_OBJ.addToCartBtnChange(...MASTER_PRODUCT_OBJ.checkForCombination());
    },
    foo: function () {
      let i = 0;
      function inner() {
        if (i == 0) MASTER_PRODUCT_OBJ.changeToDropDown();
        else if (i == 1) MASTER_PRODUCT_OBJ.changeToColorSwatch();
        else if (i == 2) MASTER_PRODUCT_OBJ.changeToImageSwatch();
        else if (i == 3) MASTER_PRODUCT_OBJ.changeToBtn();
        i > 2 ? (i = 0) : i++;
      }
      return inner;
    },
    loadStaticData: function () {
      MASTER_PRODUCT_OBJ.title.innerHTML = MASTER_PRODUCT_OBJ.js.title;
      MASTER_PRODUCT_OBJ.description.innerHTML = MASTER_PRODUCT_OBJ.js.description;
      MASTER_PRODUCT_OBJ.bigImage.src = MASTER_PRODUCT_OBJ.js.featured_image;
    },
    createImageObj: function (jsonData) {
      const sortedImageObj = {};
      let arrLastID = [];
      function innerFunction() {
        jsonData.product.images.forEach((image) => {
          if (image.variant_ids[0]) {
            image.variant_ids.forEach((variant_id) => {
              sortedImageObj[variant_id]
                ? null
                : (sortedImageObj[`${variant_id}`] = []);
              sortedImageObj[variant_id].push(image.src);
            });
            arrLastID = image.variant_ids;
          } else {
            if (arrLastID.length == 0) {
              arrLastID.push("global-images");
            }

            arrLastID.forEach((lastID) => {
              (sortedImageObj[`${lastID}`] || (sortedImageObj[lastID] = [])).push(
                image.src
              );
            });
          }
        });
        // to push global images to every variant
        for (let key in sortedImageObj) {
          if (key != "global-images") {
            if (sortedImageObj["global-images"]) {
              sortedImageObj[key].push(...sortedImageObj["global-images"]);
            }
          }
        }
        // to delete the global images since we dont need them
        // actually we need them :)
        // delete sortedImageObj["global-images"];

        // to add media thumbnails with key "global-media"
        MASTER_PRODUCT_OBJ.js.media.forEach((e) => {
          e.media_type != "image"
            ? (
              sortedImageObj["global-media"] ||
              (sortedImageObj["global-media"] = [])
            ).push([e.id, e.preview_image.src])
            : null;
        });
      }
      innerFunction();
      return sortedImageObj;
    },
    loadSmallImages: function (variantID) {
      MASTER_PRODUCT_OBJ.smallImagesRow.innerHTML = "";
      MASTER_PRODUCT_OBJ.sortedImageObj[`${variantID}`]?.forEach((imageUrl) => {
        MASTER_PRODUCT_OBJ.smallImagesRow.appendChild(MASTER_PRODUCT_OBJ.createSmallImage(imageUrl));
      });
    },
    createSmallImage: function (imageUrl) {
      const imgCol = document.createElement("div");
      imgCol.className = "x-small-img-col";

      const img = document.createElement("img");
      img.src = imageUrl;
      img.style.width = `100%`;

      img.addEventListener("click", (e) => {
        MASTER_PRODUCT_OBJ.onSmallImageClick(e);
      });
      imgCol.appendChild(img);
      return imgCol;
    },
    onSmallImageClick: function (e) {
      MASTER_PRODUCT_OBJ.loadBigImage(e.target.src);
    },
    loadPrices: function (variantID) {
      let NO_VARIANT_FOUND = true;
      MASTER_PRODUCT_OBJ.js.variants.forEach((variant) => {
        if (variant.id == variantID) {
          MASTER_PRODUCT_OBJ.displayPrice(variant.price, variant.compare_at_price);
          NO_VARIANT_FOUND = false;
        }
      });
      if (NO_VARIANT_FOUND) {
        MASTER_PRODUCT_OBJ.displayPrice();
      }
    },
    displayPrice: function (givenPrice, givenComparePrice) {
      givenPrice === null
        ? (MASTER_PRODUCT_OBJ.price.innerText = "")
        : (MASTER_PRODUCT_OBJ.price.innerText = String(givenPrice).slice(0, -2) + " INR");

      givenComparePrice === null ? (MASTER_PRODUCT_OBJ.comparedPrice.innerText = "") : console;
      MASTER_PRODUCT_OBJ.comparedPrice.innerText = String(givenComparePrice).slice(0, -2) + " INR";
    },
    loadOptionsDom: function () {
      MASTER_PRODUCT_OBJ.js.options.forEach((optionRowData) => {
        const labelAndRow = MASTER_PRODUCT_OBJ.createOptionsRow(optionRowData);
        labelAndRow.forEach((e) => {
          MASTER_PRODUCT_OBJ.variantsDiv.appendChild(e);
        });
      });
    },
    createOptionsRow: function (optionRowData) {
      const label = document.createElement("label");
      label.innerText = optionRowData.name;
      const row = document.createElement("div");
      row.className = "x-row";
      row.id = `${optionRowData.name}`;
      row.position = `${optionRowData.position}`;
      optionRowData.values.forEach((value) => {
        row.appendChild(MASTER_PRODUCT_OBJ.createVariantButton(value));
      });
      return [label, row];
    },
    createVariantButton: function (value) {
      // what to do when
      const btn = MASTER_PRODUCT_OBJ.createBtn(value);
      // function for creating a variant btn

      return btn;
    },
    onVariantBtnClick: function (e) {
      MASTER_PRODUCT_OBJ.selectedOptions[e.target.parentElement.id] = e.target.value;

      //changes btn attributes - (btn background color to black)
      MASTER_PRODUCT_OBJ.onClickBtnChangeFunctionality();
      // change dynamic content (images and prices)
      MASTER_PRODUCT_OBJ.loadDynamicContent();
    },
    checkForCombination: function () {
      let combinationAvailable = false;
      let combinationMade = false;
      // write code to check if the combination is available and whether it is sold by the store.
      const arr = MASTER_PRODUCT_OBJ.arrayOfObjectValues(MASTER_PRODUCT_OBJ.selectedOptions);

      MASTER_PRODUCT_OBJ.js.variants?.forEach((variant) => {
        if (MASTER_PRODUCT_OBJ.arraysEqual(arr, variant.options)) {
          combinationMade = true;
          combinationAvailable = variant.available;
        }
      });
      return [combinationMade, combinationAvailable];
    },
    addToCartBtnChange: function (combinationMade, combinationAvailable) {
      MASTER_PRODUCT_OBJ.addToCartBtn.style.backgroundColor =
        combinationMade && combinationAvailable ? "#ff523b" : "#808080";
      MASTER_PRODUCT_OBJ.addToCartBtn.innerText = combinationMade
        ? combinationAvailable
          ? "Add To Card"
          : "Sold Out"
        : "Combination Unavailable";
    },
    variantBtnColorChange: function () {
      // for buttons
      const btns = document.querySelectorAll("btn.x-btn");
      Array.from(btns).forEach((btn) => {
        for (const [index, [key, value]] of Object.entries(
          Object.entries(MASTER_PRODUCT_OBJ.selectedOptions)
        )) {
          if (value == btn.value) {
            btn.style.backgroundColor = "black";
            break;
          } else btn.style.backgroundColor = "#ff523b";
        }
      });
      // for dropdowns
      const dropdown = document.getElementsByTagName("select")[0];
      if (dropdown) {
        //
        dropdown.value = MASTER_PRODUCT_OBJ.selectedOptions["Color"];
      }
      // for color swatches
      const colorSwatchBtns = document.querySelectorAll("btn.x-btn-color-swatch");
      Array.from(colorSwatchBtns).forEach((btn) => {
        for (const [index, [key, value]] of Object.entries(
          Object.entries(MASTER_PRODUCT_OBJ.selectedOptions)
        )) {
          if (MASTER_PRODUCT_OBJ.selectedOptions[key] == btn.value) {
            btn.style.setProperty("--shadow", "0px 0px 0px 2px #ff523b");
            break;
          } else btn.style.setProperty("--shadow", "");
        }
      });

      // for image swatches
      const imageSwatchBtns = document.querySelectorAll("input.x-picker-img");
      Array.from(imageSwatchBtns).forEach((btn) => {
        for (const [index, [key, value]] of Object.entries(
          Object.entries(MASTER_PRODUCT_OBJ.selectedOptions)
        )) {
          if (MASTER_PRODUCT_OBJ.selectedOptions[key] == btn.value) {
            btn.style.backgroundColor = "black";
            break;
          } else btn.style.backgroundColor = "";
        }
      });
    },
    getVariantID: function () {
      let variantIDforImg = 0,
        variantID = 0;

      MASTER_PRODUCT_OBJ.js.variants.forEach((variant) => {
        let arrayOfSelectedOptionValues = MASTER_PRODUCT_OBJ.arrayOfObjectValues(MASTER_PRODUCT_OBJ.selectedOptions);
        if (MASTER_PRODUCT_OBJ.arraysEqual(arrayOfSelectedOptionValues, variant.options)) {
          // ya to featured image nahi h
          if (variant.featured_image) {
            // option me images nahi de rakhi
            variantIDforImg = variant.featured_image.variant_ids[0];
          } else variantIDforImg = "global-images";
        }
        const arr = [];
        for (const [index, [key, value]] of Object.entries(
          Object.entries(MASTER_PRODUCT_OBJ.selectedOptions)
        )) {
          arr[index] = value;
        }

        if (MASTER_PRODUCT_OBJ.arraysEqual(variant.options, arr)) {
          variantID = variant.id;
        }
      });
      //

      return { variantIDforImg, variantID };
    },
    changeToDropDown: function () {
      // //

      const row1 = document.getElementById("Color");
      row1.innerHTML = "";
      row1.style.display = "block";
      MASTER_PRODUCT_OBJ.createDropdown(row1);
      MASTER_PRODUCT_OBJ.variantBtnColorChange();
    },
    createDropdown: function (row1) {
      row1.innerHTML += `<select style="margin: 5px 0px 5px 45px"></select>`;
      const select = document.getElementsByTagName("select")[0];
      for (let i = 0; i < MASTER_PRODUCT_OBJ.js.options.length; i++) {
        if (MASTER_PRODUCT_OBJ.js.options[i].name == "Color") {
          for (let j = 0; j < MASTER_PRODUCT_OBJ.js.options[i].values.length; j++) {
            select.innerHTML += `<option value="${MASTER_PRODUCT_OBJ.js.options[i].values[j]}">${MASTER_PRODUCT_OBJ.js.options[i].values[j]}</option>`;
          }
        }
      }
      select.addEventListener("change", (e) => {
        MASTER_PRODUCT_OBJ.onVariantBtnClick(e);
      });
      // //
    },
    changeToBtn: function () {
      const row1 = document.getElementById("Color");
      row1.style.display = "flex";
      row1.innerHTML = "";
      const values = [];
      MASTER_PRODUCT_OBJ.js.options.forEach((option) => {
        option.name == "Color" ? values.push(...option.values) : null;
      });
      values.forEach((value) => {
        const btn = MASTER_PRODUCT_OBJ.createBtn(value);
        row1.appendChild(btn);
      });
      MASTER_PRODUCT_OBJ.variantBtnColorChange();
    },
    createBtn: function (value) {
      const btn = document.createElement("btn");
      btn.className = "x-btn";
      btn.style.margin = "10px";
      btn.value = value;
      btn.style.padding = "4px 30px";
      btn.innerText = value;
      btn.addEventListener("click", (e) => {
        MASTER_PRODUCT_OBJ.onVariantBtnClick(e);
      });
      return btn;
    },
    changeToColorSwatch: function () {
      // //
      const row1 = document.getElementById("Color");
      row1.style.display = "flex";
      row1.innerHTML = "";
      const values = [];
      MASTER_PRODUCT_OBJ.js.options.forEach((option) => {
        option.name == "Color" ? values.push(...option.values) : null;
      });
      values.forEach((value) => {
        const btn = MASTER_PRODUCT_OBJ.createColorSwatchBtn(value);
        row1.appendChild(btn);
      });
      MASTER_PRODUCT_OBJ.variantBtnColorChange();
    },
    createColorSwatchBtn: function (value) {
      const btn = MASTER_PRODUCT_OBJ.createBtn(value);
      btn.className = "x-btn-color-swatch";
      btn.innerText = "-----";
      btn.style.setProperty("--background", value);
      btn.style.setProperty("--background-on-hover", `${value}`);
      btn.style.setProperty("--color", `${value}`);

      return btn;
    },
    changeToImageSwatch: function () {
      const row1 = document.getElementById("Color");
      row1.innerHTML = "";
      row1.style.display = "flex";
      const values = [];
      MASTER_PRODUCT_OBJ.js.options.forEach((option) => {
        option.name == "Color" ? values.push(...option.values) : null;
      });
      console.log(`values to display in image swatch`, values);

      MASTER_PRODUCT_OBJ.createImageSwatch(values, row1);
      MASTER_PRODUCT_OBJ.variantBtnColorChange();
    },
    createImageSwatch: function (values, row1) {
      let ArrImageSrc = [];
      for (let i = 0; i < values.length; i++) {
        for (let j = 0; j < MASTER_PRODUCT_OBJ.js.variants.length; j++) {
          if (MASTER_PRODUCT_OBJ.js.variants[j][`option${MASTER_PRODUCT_OBJ.getColorPosition()}`] == values[i]) {
            if (MASTER_PRODUCT_OBJ.js.variants[j].featured_image) {
              ArrImageSrc.push(MASTER_PRODUCT_OBJ.js.variants[j].featured_image.src);
              break;
            } else if (j == MASTER_PRODUCT_OBJ.js.variants.length - 1) {
              ArrImageSrc.push(MASTER_PRODUCT_OBJ.sortedImageObj["global-images"][0]);
            }
          }
        }
      }

      ArrImageSrc.forEach((imgSrc, index) => {
        const imageEl = document.createElement("input");
        imageEl.type = "image";
        imageEl.className = "x-picker-img";
        imageEl.value = values[index];
        imageEl.src = imgSrc;
        imageEl.style.border = "0px solid #ff523b";
        imageEl.addEventListener("click", (e) => {
          MASTER_PRODUCT_OBJ.onVariantBtnClick(e);
        });
        row1.appendChild(imageEl);
      });
    },
    buyingLimit: function (limit) {
      const amountInput = document.getElementById("amount-input");
      amountInput.setAttribute("max", `${limit}`);
      amountInput.addEventListener("keydown", (e) => {
        const regex = new RegExp(/[0-9]/);
        if (regex.test(e.key)) {
          e.target.value = e.key;
          setTimeout(() => {
            e.target.value > limit
              ? e.key > limit
                ? (e.target.value = limit)
                : (e.target.value = e.key)
              : null;
            e.target.value < 1 ? (e.target.value = 1) : null;
          }, 0);
        }
      });
    },
    arraysEqual: function (a, b) {
      if (a == null || b == null) return false;
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    },
    getColorPosition: function () {
      let colorPosition = null;
      MASTER_PRODUCT_OBJ.js.options.forEach((option) => {
        option.name == "Color" ? (colorPosition = option.position) : null;
      });
      return colorPosition;
    },
    arrayOfObjectValues: function (givenObject) {
      const arr = [];
      for (const [index, [key, value]] of Object.entries(
        Object.entries(givenObject)
      )) {
        arr[index] = value;
      }
      return arr;
    },
    loadBigImage: function (imgSrc) {
      if (MASTER_PRODUCT_OBJ.bigImage.style.display == "none") {
        MASTER_PRODUCT_OBJ.bigImage.style.display = "";
        MASTER_PRODUCT_OBJ.bigImage.style.display = "none";
      }
      if (imgSrc) {
        MASTER_PRODUCT_OBJ.bigImage.src = imgSrc;
      } else {
        const firstSmallImage = document.querySelector(".x-small-img-col img");
        MASTER_PRODUCT_OBJ.bigImage.src = firstSmallImage?.src || "";
      }
    },
    onVideoClick: function (e) {
      console.log(`e.target`, e.target);
      console.log(
        `e.target.parentElement.childNodes[0].src = `,
        e.target.parentElement.childNodes[0].id
      );
      MASTER_PRODUCT_OBJ.js.media.forEach((media) => {
        media.id == e.target.parentElement.childNodes[0].id
          ? MASTER_PRODUCT_OBJ.displayVideo(media)
          : null;
      });
    },
    displayVideo: function (mediaObj) {
      if (mediaObj.media_type == "external_video") {
        if (mediaObj.host == "youtube") {
          MASTER_PRODUCT_OBJ.bigImage.innerHTML = `<iframe width="475" height="310" src="https://www.youtube-nocookie.com/embed/${mediaObj.external_id}?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else if (mediaObj.host == "vimeo") {
          MASTER_PRODUCT_OBJ.bigImage.innerHTML = `<div style="padding:56.25% 0 0 0;position:relative;"><iframe src="https://player.vimeo.com/video/${mediaObj.external_id}?h=e7e9d7498c&color=ffffff&title=0&byline=0&portrait=0&autoplay=1&loop=1&autopause=0"" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0"  allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div><script src="https://player.vimeo.com/api/player.js"></script>`;
        }
      } else if (mediaObj.media_type == "video") {
        MASTER_PRODUCT_OBJ.bigImage.innerHTML = `<video id="myVideo" src = "${mediaObj.sources[0].url}" width="475" height="310">`;
        myVideo.load();
        myVideo.play();
        myVideo.addEventListener("click", () => {
          myVideo.paused || myVideo.ended ? myVideo.play() : myVideo.pause();
        });
      }

      MASTER_PRODUCT_OBJ.bigImage.style.display = "none";
      MASTER_PRODUCT_OBJ.bigImage.style.display = "block";
    },
    loadMedia: function () {
      MASTER_PRODUCT_OBJ.sortedImageObj["global-media"]?.forEach(([id, mediaSrc]) => {
        const imgCol = document.createElement("div");
        imgCol.className = "x-small-img-col";
        const video = document.createElement("div");
        video.className = "x-video";
        video.addEventListener("click", MASTER_PRODUCT_OBJ.onVideoClick);
        const a = document.createElement("a");
        // a.href = "";
        const mediaImg = document.createElement("img");
        mediaImg.className = "media-image";
        mediaImg.src = mediaSrc;
        mediaImg.id = id;
        video.appendChild(mediaImg);
        video.appendChild(a);
        imgCol.appendChild(video);
        MASTER_PRODUCT_OBJ.smallImagesRow.appendChild(imgCol);
      });
    }




  };
  const CHILD_PRODUCTS_OBJ = {
    INIT: async function () {
      // common function arraysEqual
      CHILD_PRODUCTS_OBJ.objectFromAPIs = JSON.parse(sessionStorage.getItem("objectFromAPIs"));
      CHILD_PRODUCTS_OBJ.rule = (await DB_METHODS.getData()).filter((rule) => rule.currentRule === true)[0];
      CHILD_PRODUCTS_OBJ.childProducts = CHILD_PRODUCTS_OBJ.rule.childProducts;
      CHILD_PRODUCTS_OBJ.childProductsObj = CHILD_PRODUCTS_OBJ.makeObjectOfChildProducts();

      CHILD_PRODUCTS_OBJ.allProductsDiv = document.getElementById("all-products");

      CHILD_PRODUCTS_OBJ.selectedOptions = {};

      for (let [index, [key, [js, json]]] of Object.entries(
        Object.entries(CHILD_PRODUCTS_OBJ.childProductsObj)
      )) {
        const card = document.createElement("div");
        card.className = "x-col-4";
        card.id = js.title;
        card.handle = js.handle;

        const bigImageDiv = document.createElement("div");
        bigImageDiv.className = "d-flex align-self-center";
        const bigImage = document.createElement("img");
        bigImage.width = "150";
        bigImage.src = js.featured_image;
        bigImageDiv.appendChild(bigImage);

        const productDetailsDiv = document.createElement("div");
        productDetailsDiv.className = "d-block";

        const title = document.createElement("h2");
        title.innerHTML = js.title;
        productDetailsDiv.appendChild(title);

        const price = document.createElement("h4");
        price.innerHTML = js.price / 100 + " INR";
        productDetailsDiv.appendChild(price);
        const comparedPrice = document.createElement("h5");
        comparedPrice.innerHTML = js.compare_at_price / 100 + " INR";
        comparedPrice.style.textDecoration = "line-through";
        productDetailsDiv.appendChild(comparedPrice);

        // display btns
        js.options.forEach((option) => {
          productDetailsDiv.appendChild(createRows(option));
          function createRows(option) {
            const row = document.createElement("div");
            row.className = "my-2";
            row.style.width = "400px";
            const label = document.createElement("label");
            label.innerHTML = option.name;
            label.style = "margin: 0px 15px 20px 0px";

            row.appendChild(label);
            option.values.forEach((value) => {
              const btn = CHILD_PRODUCTS_OBJ.createBtn(value);
              row.appendChild(btn);
            });
            return row;
          }
        });

        // description
        const description = document.createElement("p");
        description.className = "text-primary ";
        description.style.width = "360px";
        description.innerHTML = js.description;
        productDetailsDiv.appendChild(description);
        // update CHILD_PRODUCTS_OBJ.selectedOptions
        CHILD_PRODUCTS_OBJ.updateSelectedOptions(js);

        card.appendChild(bigImageDiv);
        card.appendChild(productDetailsDiv);
        CHILD_PRODUCTS_OBJ.allProductsDiv.appendChild(card);
      }

      console.log(`CHILD_PRODUCTS_OBJ.selectedOptions`, CHILD_PRODUCTS_OBJ.selectedOptions);



    },
    makeObjectOfChildProducts: function () {
      const obj = {};
      CHILD_PRODUCTS_OBJ.childProducts.forEach((product) => {
        const js = CHILD_PRODUCTS_OBJ.objectFromAPIs[product][0];
        const json = CHILD_PRODUCTS_OBJ.objectFromAPIs[product][1];
        obj[product] = [js, json];
      });
      return obj;
    },
    createBtn: function (value) {
      const btn = document.createElement("btn");
      btn.className = "x-btn";
      btn.style = "margin : 5px";
      btn.innerText = value;
      btn.addEventListener("click", CHILD_PRODUCTS_OBJ.onBtnClick);
      return btn;
    },
    onBtnClick: function (e) {
      const productName = e.target.parentElement.parentElement.parentElement.id;
      const productHandle =
        e.target.parentElement.parentElement.parentElement.handle;
      const btnVariantType = e.target.parentElement.childNodes[0].innerHTML;
      const price = e.target.parentElement.parentElement.childNodes[1];
      const comparedPrice = e.target.parentElement.parentElement.childNodes[2];

      const btnValue = e.target.innerHTML;
      const bigImage =
        e.target.parentElement.parentElement.parentElement.childNodes[0]
          .childNodes[0];

      CHILD_PRODUCTS_OBJ.selectedOptions[productName][btnVariantType] = btnValue;

      const theVariant = f();

      function f() {
        let theVariant = {};
        CHILD_PRODUCTS_OBJ.childProductsObj[productHandle][0].variants.forEach((variant) => {
          if (
            CHILD_PRODUCTS_OBJ.arraysEqual(
              variant.options,
              CHILD_PRODUCTS_OBJ.arrayFromObject(CHILD_PRODUCTS_OBJ.selectedOptions[productName])
            )
          ) {
            theVariant = variant;
          }
        });

        return theVariant;
      }

      theVariant.featured_image
        ? (bigImage.src = theVariant.featured_image.src)
        : null;

      price.innerHTML = theVariant.price / 100 + " INR";
      comparedPrice.innerHTML = theVariant.compare_at_price / 100 + " INR";
    },
    updateSelectedOptions: function (js) {
      const obj = {};
      js.options.forEach((option) => {
        obj[option.name] = option.values[0];
      });
      CHILD_PRODUCTS_OBJ.selectedOptions[js.title] = obj;
    },
    arraysEqual: function (arr1, arr2) {
      if (arr1.length !== arr2.length) return false;
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
      }
      return true;
    },
    arrayFromObject: function (theObj) {
      const arr = [];
      for (const [index, [key, value]] of Object.entries(Object.entries(theObj))) {
        arr[index] = value;
      }
      return arr;
    }




  };


})()


// ##########################################################################


// ############################################################################


// CREATE
// const data = {
//   master: "apple-iphone-11-128gb-white-includes-earpods-power-adapter",
//   childProducts: ["women-jacketsingle-product-1", "leather-cover"],
// };
// DB_METHODS.addData(data);

// READ
// console.log(await DB_METHODS.getData());

// UPDATE
// DB_METHODS.updateData(
//   "apple-iphone-11-128gb-white-includes-earpods-power-adapter",
//   "childProducts",
//   ["hi", "hello"]
// );

// DELETE
// DB_METHODS.deleteData("apple-iphone-11-128gb-white-includes-earpods-power-adapter");

// ########################################################################









// ###################################################################

























// function checkSessionStorage() {
//   if (!DB_METHODS.getData()) {
//     db = DB_METHODS.openDB();
//   } else return true;
// }














// function deleteItemFromArray(itemsArray, array) {
//   itemsArray.forEach((item) => {
//     array.splice(array.indexOf(item, 1), 1);
//   });
// }
// const arr = [2, 3, 4, 5];
// deleteItemFromArray([4], arr);
// console.log(`arr`, arr);

// function extractNonUsedHandles(CurrentChildArray, sessionStorageChildArray) {
//   const nonUsedHandlesArr = CurrentChildArray.filter((item) => {
//     let ret = true;
//     sessionStorageChildArray.forEach((e) => {
//       e == item ? (ret = false) : null;
//     });
//     return ret;
//   });
//   return nonUsedHandlesArr;
// }
// code to check if i made the right function
// const arr1 = [4, 5, 6, 7];
// const arr2 = [45, 6, 7];

// nonUsedNumbers = extractNonUsedHandles(arr1, arr2);
// console.log(`arr1`, arr1);
// console.log(`arr2`, arr2);

// console.log(`nonUsedNumbers`, nonUsedNumbers);









// to get handle from url
// (baseUrl + productHandles[i] + ".js")
//   .split("/")
//   [givenUrl.split("/").length - 1].match(
//     new RegExp(/[a-z0-9\-\_]{1,}/gi)
//   )[0]










