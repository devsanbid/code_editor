class Bank {
  double _balance;
  String _accountNumber;
  String _pin;
  List<String> _transcationHistory = [];

  Bank({
    required double balance,
    required String accountNumber,
    required String pin,
  }) : _balance = balance,
       _accountNumber = accountNumber,
       _pin = pin;

  // getter
  double get balance => _balance;
  String get accountNumber => _accountNumber;
  List<String> get transcationHistory => _transcationHistory;

  //setter
  void deposit(double amount, String pin) {
    if (pin == _pin) {
      _balance += amount;
      print("\$$amount deposit successfully");
      _transcationHistory.add("deposit: \$$amount");
    } else {
      print("Please insert correct pin!!");
    }
  }

  void withdraw(double amount, String pin) {
    if(pin == _pin && amount < _balance){
      _balance -= amount;
      print("\$$amount withdraw successfully");
      _transcationHistory.add("withdraw: \$$amount");
    }else{
      print(amount > _balance ? "insufficent balance": "Please insert correct pin!!");
    }
  }
}

void main() {
  Bank bank = Bank(accountNumber: "ACC11", balance: 18_000, pin: "1234");
  bank.deposit(10_000, "1234");

  print("Bank balance: ${bank.balance}");

  // withdraw
  bank.withdraw(5_000, "1234");
  print("After withdraw Bank balance: ${bank.balance}");

  print(bank.transcationHistory);
}
