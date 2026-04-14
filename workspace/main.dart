import 'bank.dart';

void main(){
  Bank bank = Bank(accountNumber: "ACC11", balance: 18000, pin: "1234");
  print(bank.accountNumber);
}