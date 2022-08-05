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

const remainingSetOfProductHandles = new Set(productHandles);
populateHandles("first-time");

console.log(remainingSetOfProductHandles);

const container = document.getElementById("container");
const makeRuleBtn = document.getElementById("make-rule");

const setOfRules = new Set();

const makeRuleInnerHTMl = `<div class="card p-3">
<div class="autocomplete">
  <label>Master Product</label>
  <div class=" input-group mb-3" id ="master-input-div">
    <input id="master-input" type="text" name="myCountry" class="form-control" placeholder="enter the handle of master product here" style="width:max-content" >
  </div>
</div>

<div class="autocomplete">
  <label>Child Products</label>
    <div class="input-group mb-3" id ="child-input-div">
      <input type="text" id = "child-input" name="myCountry" class="form-control" placeholder="enter the handles of child products here" style="width:max-content ">
    </div>
</div>
  
<div class="d-flex">
    <btn id="add-rule" class="btn btn-outline-success" style="width:150px ;" >Add Rule</btn>
    <btn id="discard-rule" class = "btn btn-outline-secondary mx-2" style="width: 150px;" >Discard</btn>
</div>
</div>`;

makeRuleBtn.addEventListener("click", () => {
  showMakeRule(true);
  const masterInput = document.getElementById("master-input");
  const childInput = document.getElementById("child-input");
  const addRuleBtn = document.getElementById("add-rule");
  const discardRuleBtn = document.getElementById("discard-rule");
  masterInput.addEventListener("click", (e) => {
    autocomplete(e.target, remainingSetOfProductHandles);
  });
  childInput.addEventListener("click", (e) => {
    autocomplete(e.target, remainingSetOfProductHandles);
  });
  addRuleBtn.addEventListener("click", () => {
    // if (!entriesCheck()) return; // exit function if it fails entry check
    addRule();
    showListOfRulesCard(true); // shows list of added rules
    showMakeRule(); // deletes make rule card
    remakeRemainingSetofProductHandles();
    populateHandles("x");
  });
  discardRuleBtn.addEventListener("click", () => {
    showMakeRule(); // deletes make rule card
    remakeRemainingSetofProductHandles();
    populateHandles("x");
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
    console.log(js, json);

    obj[productHandles[i]] = [js, json];
  }
  return obj;
}

function autocomplete(inp, set) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function (e) {
    var a,
      b,
      i,
      val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    if (!val) return false;
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.parentNode.appendChild(a);
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
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function (e) {
    var x = document.getElementById(this.id + "autocomplete-list");
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
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  /*execute a function when someone clicks in the document:*/
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

function addSelection(parentDiv, addBefore, selectionText) {
  parentDiv.insertBefore(createBtn(), addBefore);
  createBtn(selectionText);
  function createBtn() {
    const btn = document.createElement("btn");
    btn.className = "btn btn-outline-primary";
    btn.type = "button";
    const span = document.createElement("span");
    span.innerHTML = selectionText;
    updateRemainingArray("delete", selectionText);
    btn.appendChild(span);
    btn.style.width = "200px";
    btn.classList += " text-nowrap";
    btn.classList += " removable";
    btn.addEventListener("click", removeBtn);
    return btn;
  }
}
function removeBtn(e) {
  console.log(`removing ${e.target.childNodes[0].innerHTML}`);
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
  const listOfRulesCard = document.getElementById("list-of-rules-card");
  x
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
    childInput.parentElement.childNodes.length >
    (set = new Set(productHandles)).size + 1
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
  console.log("remainingSetOfProductHandles", remainingSetOfProductHandles);
  populateHandles();
}
function populateHandles(x) {
  const ul = document.getElementById("product handles");
  ul.innerHTML = "";
  remainingSetOfProductHandles.forEach((handle) => {
    const li = document.createElement("li");
    li.innerHTML = handle;
    ul.appendChild(li);
  });
  const label = document.getElementById("product-handles-label");
  label.innerHTML = x
    ? "&nbsp;&nbsp;  All Product Handles - "
    : "&nbsp;&nbsp; Remaining Product Handles";
}
function remakeRemainingSetofProductHandles() {
  productHandles.forEach((value) => remainingSetOfProductHandles.add(value));
  console.log(`remainingSetOfProductHandles`, remainingSetOfProductHandles);
  makeRuleBtn.style.display = "";
}
function addRule() {
  const obj = {};
  console.log(`acces by outerText or innerText`);
  const RuleBtns = document.querySelectorAll(".removable");
  console.log(`ruleBtns`, RuleBtns);
  RuleBtns.forEach((btn, index) => {
    index != 0
      ? (obj["childProducts"] || (obj["childProducts"] = [])).push(
          btn.innerText
        )
      : (obj["masterProduct"] = btn.innerText);
  });
  setOfRules.add(obj);
  console.log(setOfRules);
  loadListOfRules();
}
function loadListOfRules() {
  if (setOfRules.size) {
    const listOfRules = document.getElementById("list-of-rules");
    listOfRules.innerHTML = "";
    setOfRules.forEach((rule, index) => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.innerHTML = `<b>Master Product -> </b> ${rule.masterProduct} <b>child Products -> </b>`;
      rule.childProducts.forEach((childProduct, index) => {
        li.innerHTML += (index ? ", " : " ") + childProduct;
      });
      listOfRules.appendChild(li);
    });
  } else console.log(`no rule found`);
}
function entriesCheck() {
  // const masterInput = document.getElementById("master-input");
  // const childInput = document.getElementById("child-input");
  // console.log(masterInput.parentElement.childNodes[0]);
  return true;
}
// #######################################################################
// const objectFromAPIs = await foo();
// console.log("objectFromAPIs", objectFromAPIs);
