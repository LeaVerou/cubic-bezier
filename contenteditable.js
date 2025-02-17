(function() {
  var inputList = $$('.param');
  var hiddenTextList = $$('.hidden-text');
  function onInput(input, index) {
    hiddenTextList[index].innerHTML = input.value || 0;
  }
  function onKeydown(event, input) {
    if (event.key === '-' && input.value[0] === '-') {
      event.preventDefault();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      input.blur();
    }
  }
  
  function onBlur(input, index) {
    var xy = input.value;
    if (isNaN(xy) || (!(index % 2) && (xy < 0 || xy > 1))) {
      input.value = 0;
    }
    let text = [...inputList].reduce(function(_text, item) {
      _text += item.value + ','
      return _text;
    }, '')
    text = text.slice(0, -1)
    updateBezier(text);
    update();
    updateDelayed();
  }
  
  inputList.forEach(function(input, index) {
    input.addEventListener('keydown', function(event) {
      onKeydown(event, input);
    });
    input.addEventListener('input', function(event) {
      onInput(input, index);
    });
    input.addEventListener('blur', function() {
      onBlur(input, index);
    });
  });
})()