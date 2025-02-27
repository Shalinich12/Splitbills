function splitBill(){
    const billAmount = document.getElementById('billAmount').value;
    const noOfPersons = document.getElementById("noOfPersons").value;

    const splitBillAmount = billAmount / noOfPersons;
    document.getElementById("splitBillAmount").value = Math.ceil(billForEachPerson);
}
