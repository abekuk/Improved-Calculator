const display = document.getElementById('display');
const buttons = Array.from(document.getElementsByClassName('button'));
const lightModeBtn = document.getElementById('lightModeBtn');
const fractionModeBtn = document.getElementById('fractionModeBtn');

let currentOperand = '';
let previousOperand = '';
let operation = null;
let isNewInput = false;
let isFractionMode = false; // Persistent state for Fraction Mode
let lastResult = ''; // Stores the last computed result in full precision
const maxDigits = 9; // Maximum allowed digits for display

// Toggle light mode
lightModeBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('inverted-mode');
});

// Fraction Mode: Toggle between Fraction Mode and Decimal Mode
fractionModeBtn.addEventListener('click', () => {
    isFractionMode = !isFractionMode; // Toggle the mode state

    // Update the button text
    fractionModeBtn.innerText = isFractionMode ? 'Decimal Mode' : 'Fraction Mode';

    if (lastResult && display.innerText !== 'Undefined') {
        // Display value as fraction or decimal based on mode
        if (isFractionMode) {
            const fraction = decimalToFraction(lastResult);
            display.innerText = fraction.length <= maxDigits ? fraction : 'Max Digits';
        } else {
            display.innerText = formatDisplay(lastResult); // Use formatted full decimal
        }
    }
    adjustFontSize();
});

// Utility function to convert decimal to fraction
function decimalToFraction(decimal) {
    const tolerance = 1.0E-6;
    let numerator = 1;
    let denominator = 1;
    while (Math.abs(decimal * denominator - Math.round(decimal * denominator)) > tolerance) {
        denominator++;
    }
    numerator = Math.round(decimal * denominator);

    // Simplify fractions ending with /1
    return denominator === 1 ? `${numerator}` : `${numerator}/${denominator}`;
}

// Adjust font size dynamically based on display length
function adjustFontSize() {
    const displayLength = display.innerText.length;

    if (displayLength <= 5) {
        display.style.fontSize = '4.5rem'; // Largest font size for up to 5 digits
    } else if (displayLength === 6) {
        display.style.fontSize = '4.2rem'; // Slightly smaller for 6 digits
    } else if (displayLength === 7) {
        display.style.fontSize = '3.8rem'; // Adjust for 7 digits
    } else if (displayLength === 8) {
        display.style.fontSize = '3.5rem'; // Adjust for 8 digits
    } else if (displayLength === 9) {
        display.style.fontSize = '3.2rem'; // Smallest for 9 digits
    }
}

// Calculator logic
buttons.forEach(button => {
    button.addEventListener('click', () => {
        const isOperator = ['÷', '×', '-', '+', '=', 'AC', '+/-', '%'].includes(button.innerText);

        if (!isOperator && display.innerText.replace('.', '').length >= maxDigits) {
            return; // Ignore additional numerical inputs
        }

        switch (button.innerText) {
            case 'AC':
                display.innerText = '0';
                currentOperand = '';
                previousOperand = '';
                operation = null;
                isNewInput = false;
                lastResult = ''; // Reset last result
                adjustFontSize();
                break;
            case '+/-':
                if (display.innerText !== '0' && display.innerText !== 'Undefined') {
                    currentOperand = parseFloat(display.innerText) * -1; // Toggle the sign
                    display.innerText = currentOperand.toString(); // Ensure correct display
                    lastResult = currentOperand; // Save last result
                }
                adjustFontSize();
                break;
            case '%':
                currentOperand = parseFloat(display.innerText) / 100;
                if (isFractionMode) {
                    display.innerText = decimalToFraction(currentOperand);
                } else {
                    display.innerText = formatDisplay(currentOperand);
                }
                lastResult = currentOperand; // Store the result
                adjustFontSize();
                break;
            case '.':
                if (!currentOperand.includes('.')) {
                    if (display.innerText === '0' || isNewInput) {
                        display.innerText = '0.'; // Start with 0. for a new decimal number
                    } else {
                        display.innerText += '.'; // Append the decimal to the existing number
                    }
                    currentOperand = display.innerText; // Update the current operand
                    isNewInput = false; // Ensure the next input appends
                }
                adjustFontSize();
                break;
            case '÷':
            case '×':
            case '-':
            case '+':
                if (operation !== null && currentOperand !== '') {
                    // Calculate and store the result
                    previousOperand = calculate(previousOperand, currentOperand, operation);
                    if (previousOperand === 'Error') {
                        display.innerText = 'Undefined';
                        lastResult = ''; // Clear last result on error
                    } else {
                        lastResult = previousOperand; // Store the result
                        display.innerText = isFractionMode
                            ? decimalToFraction(previousOperand)
                            : formatDisplay(previousOperand);
                    }
                } else {
                    previousOperand = display.innerText; // Set the first operand
                }
                operation = button.innerText; // Store the current operation
                currentOperand = ''; // Reset the current operand for new input
                isNewInput = true; // Prepare for new input
                break;
            case '=':
                if (operation === null || currentOperand === '') return;
                const result = calculate(previousOperand, currentOperand, operation);
                if (result === 'Error') {
                    display.innerText = 'Undefined';
                    lastResult = ''; // Clear last result on error
                } else {
                    lastResult = result; // Store the result
                    display.innerText = isFractionMode
                        ? decimalToFraction(result)
                        : formatDisplay(result);
                }
                previousOperand = ''; // Reset after calculation
                operation = null; // Clear the operation
                currentOperand = display.innerText; // Store the result for potential reuse
                isNewInput = true; // Prepare for new input
                adjustFontSize();
                break;
            default: // Numbers or decimal point
                if (display.innerText === '0' || isNewInput) {
                    display.innerText = button.innerText; // Replace initial 0 or clear display
                    isNewInput = false;
                } else {
                    display.innerText += button.innerText; // Append numbers
                }
                currentOperand = display.innerText; // Update current operand
                adjustFontSize();
        }
    });
});

function calculate(a, b, op) {
    a = parseFloat(a);
    b = parseFloat(b);
    if (isNaN(a) || isNaN(b)) return 'Error'; // Prevent NaN results
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '×': return a * b;
        case '÷': return b !== 0 ? a / b : 'Error'; // Return 'Error' for division by zero
        default: return 'Error';
    }
}

function formatDisplay(number) {
    let numStr = number.toString();
    const maxLength = maxDigits;

    // Cap the number of digits at maxLength
    if (numStr.includes('.')) {
        const [intPart, decPart] = numStr.split('.');
        return intPart.length >= maxLength
            ? intPart.slice(0, maxLength)
            : `${intPart}.${decPart.slice(0, maxLength - intPart.length - 1)}`;
    }

    // Cap the length for integers
    return numStr.slice(0, maxLength);
}
