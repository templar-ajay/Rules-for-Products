(() => {



  const PRODUCTS_PAGE = {
    INIT: () => {
      console.log(`products page`,);



    }
  }
  const RULES_PAGE = {
    INIT: () => {
      console.log(`rules page`,);

      RULES_PAGE.productHandles = [
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
      ]
      // RULES_PAGE.productHandlesSet = new Set(RULES_PAGE.productHandles)
      RULES_PAGE.remakeProductHandlesSet()
      RULES_PAGE.currentSelection = RULES_PAGE.createCurrentSelection()


      RULES_PAGE.makeRuleBtn = document.querySelector("#make-rule")
      RULES_PAGE.makeRuleCard = document.querySelector("#make-rule-card")

      RULES_PAGE.makeRuleBtn.addEventListener('click', () => {
        RULES_PAGE.makeRuleCard.innerHTML = `
          <form autocomplete = "off">
            <div class="card p-3">
              <div class="autocomplete">
                <label for="master-input" >Master Product</label>
                <div class=" input-group mb-3" id="master-input-div">
                  <input id="master-input" type="text" name="myCountry" class="form-control" placeholder="enter the handle of master product here" style="width:max-content" >
                </div>
              </div>
              <div class="autocomplete">
                <label for="child-input">Child Products</label>
                <div class="input-group mb-3" id="child-input-div">
                  <input type="text" id="child-input" name="myCountry" autocomplete="off" class="form-control" placeholder="enter the handles of child products here" style="width:max-content ">
                </div>
              </div>

              <div class="d-flex">
                <btn id="add-rule" class="btn btn-success" style="width:150px" >Add Rule</btn>
                <btn id="discard-rule" autocomplete="off" class="btn btn-outline-secondary mx-2" style="width: 150px;" >Discard</btn>
              </div>
            </div>
          </form >`

        const masterInput = document.querySelector('#master-input')
        const childInput = document.querySelector("#child-input")

        Array.from([masterInput, childInput]).forEach(input => {
          input.addEventListener("click", (e) => {
            RULES_PAGE.autocomplete(e.target, RULES_PAGE.productHandlesSet)
          })
        });
        document.querySelector("#add-rule").addEventListener("click", RULES_PAGE.addRule);
        document.querySelector("#discard-rule").addEventListener("click", RULES_PAGE.discardRule);
      })
    },
    addRule: async () => {
      console.log(`addRule Btn called`);
      if (RULES_PAGE.inputCheck()) {
        await DB_METHODS.addData(RULES_PAGE.currentSelection)
        RULES_PAGE.discardRule() // removes add-rule-card, resets productHandlesSet and currentSelection, shoes makeRuleBtn
      } else RULES_PAGE.guideUser("addRule")
    },
    discardRule: async () => {
      RULES_PAGE.currentSelection = RULES_PAGE.createCurrentSelection();
      RULES_PAGE.makeRuleCard.innerHTML = "";
      await RULES_PAGE.remakeProductHandlesSet()
      RULES_PAGE.makeRuleBtn.style.display = "";
    },
    remakeProductHandlesSet: async () => {
      const arr = await DB_METHODS.getData();
      RULES_PAGE.productHandlesSet = new Set(RULES_PAGE.productHandles);
      arr.forEach(rule => RULES_PAGE.productHandlesSet.delete(rule.masterProduct));
    },
    inputCheck: () => {
      return (RULES_PAGE.currentSelection.masterProduct && RULES_PAGE.currentSelection.childProducts.length)
    },
    guideUser: (event) => {
      const masterInput = document.querySelector("#master-input");
      const childInput = document.querySelector("#child-input");

      if (RULES_PAGE.currentSelection.masterProduct.length) {
        masterInput.disabled = true;
        masterInput.placeholder = "is the Master Product";
        masterInput.classList.remove("bg-warning");
      } else {
        masterInput.disabled = false;
        event == "addRule" ? (
          masterInput.placeholder = "enter one master product",
          masterInput.classList.add("bg-warning")) : null
      }
      console.log(RULES_PAGE.currentSelection.childProducts)
      if (!RULES_PAGE.currentSelection.childProducts.length) {
        event == "addRule" ? (
          RULES_PAGE.productHandlesSet.size ? (
            childInput.placeholder = "at least one child product required",
            childInput.classList.add("bg-warning")) : (RULES_PAGE.discardRule(), (new bootstrap.Toast(document.querySelector('#liveToast')))).show()) : null
        childInput.disabled = false;
      } else if (0 < (RULES_PAGE.productHandlesSet.size - (RULES_PAGE.currentSelection.masterProduct.length ? 0 : 1))) {
        childInput.classList.remove("bg-warning");
        childInput.placeholder = "enter the child products here";
        childInput.disabled = false;
      } else {
        childInput.classList.remove('bg-warning');
        childInput.disabled = true;
        childInput.placeholder = RULES_PAGE.currentSelection.childProducts.length == 1 ? "is the child product" : "are the child products";
      }
    }
    ,
    createCurrentSelection: () => {
      return { masterProduct: "", childProducts: [] }
    }
    ,
    addSelection: function (parentDiv, addBefore, selectionText, isNonRemovable) {
      parentDiv.insertBefore(RULES_PAGE.createInputBtn(selectionText, isNonRemovable), addBefore);
      const productHandle = selectionText;
      if (addBefore.id == "master-input") {
        RULES_PAGE.currentSelection["masterProduct"] = selectionText;
      } else if (addBefore.id == "child-input") {
        RULES_PAGE.currentSelection["childProducts"]
          .push(productHandle);
      }
      RULES_PAGE.productHandlesSet.delete(selectionText);
      RULES_PAGE.guideUser()
    },
    removeSelection: function (event) {
      event.target.parentNode.id === "master-input-div" ? RULES_PAGE.currentSelection.masterProduct = "" : RULES_PAGE.currentSelection.childProducts.splice(RULES_PAGE.currentSelection.childProducts.indexOf(event.target.parentNode.id), 1)

      RULES_PAGE.productHandlesSet.add(event.target.childNodes[0].innerHTML)
      event.target.remove()
      RULES_PAGE.guideUser()
    },
    createInputBtn: function (selectionText, isNonRemovable) {
      const btn = document.createElement("btn");
      btn.className = "btn btn-outline-primary";
      btn.type = "button";
      const span = document.createElement("span");
      span.innerHTML = selectionText;

      btn.appendChild(span);
      btn.style.width = isNonRemovable ? "max-content" : "200px";
      btn.classList += " text-nowrap";
      btn.classList += isNonRemovable ? " non-removable" : " removable";
      if (isNonRemovable) {
      } else {
        btn.addEventListener("click", RULES_PAGE.removeSelection);
      }
      return btn;
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
              RULES_PAGE.addSelection(
                inp.parentElement,
                inp,
                this.getElementsByTagName("input")[0].value
              );
              // RULES_PAGE.changeInputs();
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
      function closeAllLists(element) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
          if (element != x[i] && element != inp) {
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
  }
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

          const objectStore = db.createObjectStore("rules", { keyPath: "masterProduct" });

          objectStore.transaction.oncomplete = (e) => {
          };
        };
      });
    },
    addData: async function (data) {
      if (!RULES_PAGE.db) RULES_PAGE.db = await DB_METHODS.openDB();

      const objectStore = RULES_PAGE.db
        .transaction(["rules"], "readwrite")
        .objectStore("rules");

      const request = objectStore.add(data);

      request.onsuccess = (e) => {
        console.log(`data added successfully`,);

      };
      request.onerror = (e) => {
        console.log(`Error loading database ${e.target.error}`);
      };
    },
    getData: async function (
      key /* used to delete the item , leave empty if you just need to get items */
    ) {
      if (!RULES_PAGE.db) RULES_PAGE.db = await DB_METHODS.openDB();
      return new Promise((resolve, reject) => {
        const objectStore = RULES_PAGE.db
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
            ? (cursor.value.masterProduct === key
              ? (cursor.delete()
                // ,console.log(`successfully deleted ${cursor.value.masterProduct}`)
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
      if (!RULES_PAGE.db) RULES_PAGE.db = await DB_METHODS.openDB();
      const objectStore = RULES_PAGE.db.transaction("rules", "readwrite").objectStore("rules");

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
  const STORAGE_METHOD = {

  }
  const COOKIE_METHOD = {

  };


  DB_METHODS.openDB()
  document.onload = document.querySelector("#productsPage") ? PRODUCTS_PAGE.INIT() : RULES_PAGE.INIT()


})()