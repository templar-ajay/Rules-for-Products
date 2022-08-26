const baseUrl = "https://afzal-test-shop.myshopify.com/products/";
const productHandles = [
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
];
const failedProducts = [];
checkForCookies(); // cookie validation
const cookiesEmpty = crossCheckIfProductIsAvailable();

function checkForCookies() {
  document.cookie
    ?.split(";")
    .find((item) => {
      return item.includes("failedProduct");
    })
    ?.split("=")[1]
    .split(",")
    .forEach((failedProduct) => {
      failedProducts.push(failedProduct);
    });

  failedProducts?.forEach((failedProduct, index) => {
    productHandles.splice(productHandles.indexOf(failedProduct), 1);
  });
}

function crossCheckIfProductIsAvailable() {
  if (!failedProducts?.length) return true;

  const succeeded = [];
  failedProducts.forEach((failedProduct) => {
    getApi(`${baseUrl + failedProduct}.json`).then((json) => {
      json
        ? (succeeded.push(failedProduct), productHandles.push(failedProduct))
        : null;
    });
  });
  succeeded.forEach((product) => {
    failedProducts.splice(failedProducts.indexOf(product), 1);
  });
  failedProducts.length
    ? updateCookie("failedProduct", failedProducts.join(","))
    : clearCookie("failedProduct");

  return false;
}

// ##########################################################################
// declaring constants
const container = document.getElementById("container");
const makeRuleBtn = document.getElementById("make-rule");
const currentRuleEntries = {};
const remainingSetOfProductHandles = new Set();

// ############################################################################
// opening the indexedDB database
const db = await openDB().catch((err) => {});

// CREATE
// const data = {
//   master: "apple-iphone-11-128gb-white-includes-earpods-power-adapter",
//   childProducts: ["women-jacketsingle-product-1", "leather-cover"],
// };
// addData(data);

// READ
// console.log(await getData());

// UPDATE
// updateData(
//   "apple-iphone-11-128gb-white-includes-earpods-power-adapter",
//   "childProducts",
//   ["hi", "hello"]
// );

// DELETE
// deleteData("apple-iphone-11-128gb-white-includes-earpods-power-adapter");

// ########################################################################

remakeRemainingSetOfProductHandles();

if (!db) db = await openDB();
(await loadListOfRules())
  ? (showListOfRulesCard(true),
    removeMasterProductsFromRemainingSetOfProductHandles())
  : null;

const makeRuleInnerHTMl = `<form autocomplete="off"><div class="card p-3">
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
</div></form>`;

makeRuleBtn.addEventListener("click", () => {
  showMakeRule(true);
  const masterInput = document.querySelector("#master-input");
  const childInput = document.querySelector("#child-input");
  const addRuleBtn = document.querySelector("#add-rule");
  const discardRuleBtn = document.querySelector("#discard-rule");

  masterInput.addEventListener("click", function (e) {
    showErrorInInput(false);
    autocomplete(masterInput, remainingSetOfProductHandles);
  });

  childInput.addEventListener("click", function (e) {
    showErrorInInput(false);
    autocomplete(childInput, remainingSetOfProductHandles);
  });

  addRuleBtn.addEventListener("click", () => {
    // if (!entriesCheck()) return; // exit function if it fails entry check

    addRule()
      ? (showListOfRulesCard(true, true), //  shows list of added rules
        loadListOfRules(),
        showMakeRule(), // deletes make rule card
        remakeRemainingSetOfProductHandles(),
        removeMasterProductsFromRemainingSetOfProductHandles(),
        (makeRuleBtn.style.display = ""))
      : null;
  });

  discardRuleBtn.addEventListener("click", () => {
    showMakeRule(); // deletes make rule card
    remakeRemainingSetOfProductHandles();
    removeMasterProductsFromRemainingSetOfProductHandles();
    makeRuleBtn.style.display = "";
  });
});

// ###################################################################
async function getApi(givenUrl) {
  try {
    const response = await fetch(givenUrl);
    const data = await response.json();
    return data;
  } catch (err) {
    console.log(`failed to load data from ${givenUrl}`);
  }
}
async function foo() {
  const obj = {};
  for (let i = 0; i < productHandles.length; i++) {
    const js = await getApi(`${baseUrl + productHandles[i]}.js`);
    const json = await getApi(`${baseUrl + productHandles[i]}.json`);

    js && json
      ? (obj[productHandles[i]] = [js, json])
      : (console.log(
          `failed to fetch data of product ${productHandles[i]}, removing it from products array`
        ),
        failedProducts.push(productHandles[i]));
  }
  updateCookie("failedProduct", failedProducts.join(","));
  failedProducts.forEach((failedProduct) => {
    productHandles.splice(productHandles.indexOf(failedProduct), 1);
  });
  cookiesEmpty ? window.location.reload() : null;
  return obj;
}

function autocomplete(inp, set) {
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
          addSelection(
            inp.parentElement,
            inp,
            this.getElementsByTagName("input")[0].value
          );
          changeInputs();
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
}

function addSelection(parentDiv, addBefore, selectionText, isNonRemovable) {
  parentDiv.insertBefore(createBtn(), addBefore);
  function createBtn() {
    const btn = document.createElement("btn");
    btn.className = "btn btn-outline-primary";
    btn.type = "button";
    const span = document.createElement("span");
    span.innerHTML = selectionText;
    updateRemainingSetOfProductHandles("delete", selectionText);

    btn.appendChild(span);
    btn.style.width = isNonRemovable ? "max-content" : "200px";
    btn.classList += " text-nowrap";
    btn.classList += isNonRemovable ? " non-removable" : " removable";
    if (isNonRemovable) {
    } else {
      btn.addEventListener("click", removeBtn);
    }

    return btn;
  }
  if (addBefore.id == "master-input") {
    currentRuleEntries["masterProduct"] = selectionText;
  } else if (addBefore.id == "child-input") {
    (
      currentRuleEntries["childProducts"] ||
      (currentRuleEntries["childProducts"] = [])
    ).push(selectionText);
  }
}
function removeBtn(e) {
  // console.log(`removing ${e.target.childNodes[0].innerHTML}`);
  updateRemainingSetOfProductHandles("add", e.target.childNodes[0].innerHTML);

  updateCurrentSelectionChildProductSet(
    "splice",
    e.target.childNodes[0].innerHTML
  );

  e.target.remove();
  changeInputs();
  checkIfChildProductsEmpty();
}
function showMakeRule(x) {
  const makeRuleCard = document.querySelector("#make-rule-card");
  x
    ? (makeRuleCard.innerHTML = makeRuleInnerHTMl)
    : (makeRuleCard.innerHTML = "");
}

function showListOfRulesCard(x, force) {
  const listOfRulesCard = document.querySelector("#list-of-rules-card");
  const listOfRulesEl = document.querySelector("#list-of-rules");
  listOfRulesEl.innerHTML == "" && !force
    ? null
    : x
    ? (listOfRulesCard.style.display = "block")
    : (listOfRulesCard.style.display = "none");
}

function changeInputs() {
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
    (set = new Set(remainingSetOfProductHandles)).size <
    (masterInput.parentElement.childNodes.length > 3 ? 1 : 2)
  ) {
    childInput.disabled = "true";
    childInput.placeholder = "are the child products";
  } else {
    childInput.disabled = "";
    childInput.placeholder = "enter the handles of child products here";
  }
}

function updateRemainingSetOfProductHandles(method, value) {
  remainingSetOfProductHandles[method](value);
}

function remakeRemainingSetOfProductHandles() {
  productHandles.forEach((value) => remainingSetOfProductHandles.add(value));
}

async function addRule() {
  if (entriesCheck()) {
    // perform crud operation in local storage

    const ArrayOfRules = await getData();

    const rule = {
      master: currentRuleEntries.masterProduct,
      childProducts: currentRuleEntries.childProducts,
    };
    addData(rule);

    // updateData(
    //   currentRuleEntries.masterProduct,
    //   "childProducts",
    //   currentRuleEntries.childProducts
    // );
    // old code
    // ArrayOfRules[currentRuleEntries.masterProduct] = Array.from(
    //   currentRuleEntries.childProducts
    // );

    // sessionStorage.setItem("rules", JSON.stringify(ArrayOfRules));

    resetCurrentRuleEntriesObject();

    await getData();
    loadListOfRules();
    return true;
  } else {
    showErrorInInput(true);
    return false;
  }
}

async function loadListOfRules() {
  const ArrayOfRules = await getData();
  const listOfRulesEl = document.querySelector("#list-of-rules");
  listOfRulesEl.innerHTML = "";

  ArrayOfRules.forEach((obj, index) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between ";
    li.style.width = "100%";
    li.innerHTML = `<b class = "my-3"> ${obj.master} </b>`; // Note -  here we will use value now

    const span = document.createElement("span");

    span.appendChild(createBtn(obj.master, "Preview", "primary"));
    span.appendChild(createBtn(obj.master, "Edit-Rule", "warning"));
    span.appendChild(createBtn(obj.master, "Delete", "danger"));

    li.appendChild(span);
    listOfRulesEl.appendChild(li);
  });

  return await ArrayOfRules.length; // returns false if object is empty;
}

function entriesCheck() {
  const masterInput = document.querySelector("#master-input");
  const childInput = document.querySelector("#child-input");
  if (
    masterInput.parentElement.childNodes.length > 3 &&
    childInput.parentElement.childNodes.length > 3
  )
    return true;
  else return false;
}

function resetCurrentRuleEntriesObject() {
  currentRuleEntries.masterProduct = "";
  currentRuleEntries.childProducts = [];
}

// function checkSessionStorage() {
//   if (!getData()) {
//     db = openDB();
//   } else return true;
// }

function removeMasterProductsFromRemainingSetOfProductHandles() {
  // To remove master products from Set of remaining products
  getData()
    .then((ArrayOfRules) => {
      ArrayOfRules.forEach((obj) => {
        remainingSetOfProductHandles.delete(obj.master);
      });
    })
    .catch((err) => console.log(`err`, err));
}

function showErrorInInput(x) {
  const masterInput = document.querySelector("#master-input");
  const childInput = document.querySelector("#child-input");

  const y = remainingSetOfProductHandles.size > 2;

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
}

function createBtn(id, type, color) {
  const button = document.createElement("button");
  button.className = `btn btn-outline-${color} ${
    type == "Preview" && !JSON.parse(sessionStorage.getItem("objectFromAPIs"))
      ? "disabled"
      : null
  } mx-2 my-2`;
  button.id = `${id}-${type}-btn`;
  button.innerHTML = type[0].toUpperCase() + type.slice(1);
  button.addEventListener("click", (e) => {
    type == "Preview"
      ? onViewBtnClick(id)
      : type == "Edit-Rule"
      ? onEditBtnClick(id)
      : type == "Delete"
      ? onDeleteBtnClick(id)
      : null;
  });
  return button;
}

async function onViewBtnClick(id) {
  const rules = await getData();
  rules.forEach((rule) => {
    updateData(rule.master, "currentRule", false);
  });
  const theRule = rules.filter((rule) => rule.master === id)[0];
  updateData(id, "currentRule", true);

  window.open("./products-page/index.html");
}

async function onEditBtnClick(id) {
  loadCurrentRuleEntries();
  showListOfRulesCard();
  showMakeRule(true);
  const updateRuleBtn = document.querySelector("#add-rule");
  updateRuleBtn.innerHTML = "Update Rule";
  const masterInput = document.querySelector("#master-input");
  addSelection(masterInput.parentElement, masterInput, id, true);
  const childInput = document.querySelector("#child-input");
  const rules = await getData();
  const theRule = rules.filter((rule) => {
    return rule.master === id;
  });
  theRule[0].childProducts.forEach((selectionText) => {
    addSelection(childInput.parentElement, childInput, selectionText, false);
  });
  // rules[id].forEach((childHandle) => {
  //   remainingSetOfProductHandles.delete(childHandle);
  // });
  childInput.addEventListener("click", () => {
    autocomplete(childInput, remainingSetOfProductHandles);
  });
  changeInputs();

  updateRuleBtn.addEventListener("click", async () => {
    const rulesObj = await getData();
    const theRule = rulesObj.filter((rule) => rule.master === id)[0];
    theRule.childProducts = currentRuleEntries.childProducts;

    updateData(theRule.master, "childProducts", theRule.childProducts);

    remakeRemainingSetOfProductHandles();
    removeMasterProductsFromRemainingSetOfProductHandles();
    resetCurrentRuleEntriesObject();

    showMakeRule(); //hides make rules card
    showListOfRulesCard(true);
    makeRuleBtn.style.display = "";
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

    remakeRemainingSetOfProductHandles();
    removeMasterProductsFromRemainingSetOfProductHandles();
    resetCurrentRuleEntriesObject();
    showMakeRule();
    showListOfRulesCard(true);
    makeRuleBtn.style.display = "";
  });
  makeRuleBtn.style.display = "none";
}

function updateCurrentSelectionChildProductSet(method, value) {
  currentRuleEntries.childProducts[method](
    currentRuleEntries.childProducts.indexOf(value),
    1
  );
}
async function loadCurrentRuleEntries(id) {
  currentRuleEntries.masterProduct = id;
  const rules = await getData();
  const theRule = rules.filter((rule) => (rule.master === id ? true : false));
  currentRuleEntries.childProducts = theRule.childProducts;
}

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

async function onDeleteBtnClick(id) {
  // const rules = await getData();
  // const theRule = rules.filter((rule) => rule.master === id)[0];
  // // delete rulesObj[id];

  deleteData(id);

  loadListOfRules();
  remakeRemainingSetOfProductHandles();
  removeMasterProductsFromRemainingSetOfProductHandles();
}
function checkIfChildProductsEmpty() {
  currentRuleEntries.childProducts.length < 1
    ? (onDeleteBtnClick(currentRuleEntries.masterProduct),
      showMakeRule(),
      loadListOfRules(),
      showListOfRulesCard(true),
      (makeRuleBtn.style.display = ""))
    : null;
}

// #######################################################################
const objectFromAPIs = await foo();
sessionStorage.setItem("objectFromAPIs", JSON.stringify(objectFromAPIs));
document.querySelector(".disabled")?.classList.remove("disabled");

// #######################################################################
// converting to indexedDB
import {
  openDB,
  addData,
  getData,
  updateData,
  deleteData,
} from "./myAsyncIndexedDBMethods.js";

function clearCookie(name) {
  document.cookie = name + `= ;expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
}
function updateCookie(name, value) {
  document.cookie = `${name}=${value};Max-Age=86400; SameSite=Strict; Secure`;
  console.trace(`cookie updated to`, document.cookie);
}

// to get handle from url
// (baseUrl + productHandles[i] + ".js")
//   .split("/")
//   [givenUrl.split("/").length - 1].match(
//     new RegExp(/[a-z0-9\-\_]{1,}/gi)
//   )[0]
