
class Animal {
    String name;
    int age;

    Animal({required this.name, required this.age});
}

class Dog extends Animal {
    Dog({required super.name, required super.age});
}

void main(){
    Dog dog = Dog(name: "kali", age: 20);
    print("dog age: ${dog.age}"); // 20
    print("dog name: ${dog.name}"); // name
}

