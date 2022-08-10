const productHandles = [
  "women-jacketsingle-product-1",
  "shoes",
  "apple-iphone-11-128gb-white-includes-earpods-power-adapter",
  "arista-variant-images-test",
  "leather-cover",
  "the-hoxton-clutch-in-plastic-4",
  "short_video_product",
  "shirt_with_video",
  "shirt_with_video",
];
const baseUrl = "https://afzal-test-shop.myshopify.com/products/";

// ##########################################################################

const container = document.getElementById("container");
const makeRuleBtn = document.getElementById("make-rule");
const currentRuleEntries = {};
const remainingSetOfProductHandles = new Set();
remakeRemainingSetOfProductHandles();
console.log(remainingSetOfProductHandles);

checkLocalStorage()
  ? loadListOfRules()
    ? (showListOfRulesCard(true),
      removeMasterProductsFromRemainingSetOfProductHandles())
    : null
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
      ? (showListOfRulesCard(true), //  shows list of added rules
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
  const response = await fetch(givenUrl);
  const data = await response.json();
  return data;
}
async function foo() {
  const obj = {};
  for (let i = 0; i < productHandles.length; i++) {
    const js = await getApi(`${baseUrl + productHandles[i]}.js`);
    const json = await getApi(`${baseUrl + productHandles[i]}.json`);
    // console.log(js, json);

    obj[productHandles[i]] = [js, json];
  }
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
    updateRemainingArray("delete", selectionText);
    btn.appendChild(span);
    btn.style.width = isNonRemovable ? "max-content" : "200px";
    btn.classList += " text-nowrap";
    btn.classList += isNonRemovable ? " non-removable" : " removable";
    btn.addEventListener("click", isNonRemovable ? null : removeBtn);
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
  console.log(`currentRuleEntries`, currentRuleEntries);
}
function removeBtn(e) {
  // console.log(`removing ${e.target.childNodes[0].innerHTML}`);
  updateRemainingArray("add", e.target.childNodes[0].innerHTML);
  e.target.remove();
  changeInputs();
}
function showMakeRule(x) {
  const makeRuleCard = document.getElementById("make-rule-card");
  x
    ? (makeRuleCard.innerHTML = makeRuleInnerHTMl)
    : (makeRuleCard.innerHTML = "");
}

function showListOfRulesCard(x) {
  const listOfRulesCard = document.querySelector("#list-of-rules-card");
  const listOfRulesEl = document.querySelector("#list-of-rules");
  listOfRulesEl.innerHTML == ""
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

function updateRemainingArray(method, value) {
  remainingSetOfProductHandles[method](value);
  // console.log("remainingSetOfProductHandles", remainingSetOfProductHandles);
}

function remakeRemainingSetOfProductHandles() {
  productHandles.forEach((value) => remainingSetOfProductHandles.add(value));
  console.log(`remainingSetOfProductHandles`, remainingSetOfProductHandles);
}

function addRule() {
  if (entriesCheck()) {
    // perform crud operation in local storage

    const ObjectFromRules = JSON.parse(localStorage.getItem("rules"));
    ObjectFromRules[currentRuleEntries.masterProduct] =
      currentRuleEntries.childProducts;
    localStorage.setItem("rules", JSON.stringify(ObjectFromRules));

    resetCurrentRuleEntriesObject();

    console.log(localStorage.getItem("rules"));
    loadListOfRules();
    return true;
  } else {
    showErrorInInput(true);
    return false;
  }
}

function loadListOfRules() {
  const ObjectFromRules = JSON.parse(localStorage.getItem("rules"));
  const listOfRulesEl = document.querySelector("#list-of-rules");
  listOfRulesEl.innerHTML = "";

  for (const [key, value] of Object.entries(ObjectFromRules)) {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between";
    li.style.width = "100%";
    li.innerHTML = `<b> ${key} </b>`;

    const span = document.createElement("span");

    span.appendChild(createBtn(key, "Preview", "primary"));
    span.appendChild(createBtn(key, "Edit-Rule", "warning"));

    li.appendChild(span);
    listOfRulesEl.appendChild(li);
  }
  return Object.keys(ObjectFromRules).length; // returns false if object is empty;
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

function checkLocalStorage() {
  if (!localStorage.getItem("rules")) {
    localStorage.setItem("rules", "{}");
  } else return true;
}
function removeMasterProductsFromRemainingSetOfProductHandles() {
  // To remove master products from Set of remaining products
  const ObjectFromRules = JSON.parse(localStorage.getItem("rules"));
  for (const [key, value] of Object.entries(ObjectFromRules)) {
    remainingSetOfProductHandles.delete(key);
  }
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
  button.className = `btn btn-outline-${color} mx-2`;
  button.id = `${id}-${type}-btn`;
  button.innerHTML = type[0].toUpperCase() + type.slice(1);
  button.addEventListener("click", (e) => {
    type == "Preview"
      ? onViewBtnClick(id)
      : type == "Edit-Rule"
      ? onEditBtnClick(id)
      : null;
  });
  return button;
}
function onViewBtnClick(id) {
  console.log(`id`, id);

  const rules = JSON.parse(localStorage.getItem("rules"));
  const rule = {};
  rule[id] = rules[id];
  console.log(`rule`, rule);
  localStorage.setItem("rule", rule);
  // window.open("./multiple-products-page/index.html");
}
function onEditBtnClick(id) {
  console.log(`edit the rule for ${id}`);
  showMakeRule(true);
  const updateRuleBtn = document.querySelector("#add-rule");
  updateRuleBtn.innerHTML = "Update Rule";
  const masterInput = document.querySelector("#master-input");
  addSelection(masterInput.parentElement, masterInput, id, true);
  const childInput = document.querySelector("#child-input");
  const rules = JSON.parse(localStorage.getItem("rules"));
  addSelection(childInput.parentElement, childInput, rules[id], false);
  changeInputs();
}

// #######################################################################
// const objectFromAPIs = await foo();
// console.log("objectFromAPIs", objectFromAPIs);
