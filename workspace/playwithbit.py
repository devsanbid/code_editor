
def binary(decimal):
    ans = ""
    while(decimal > 0):
       last_bit = decimal & 1
       ans = ans + str(last_bit)
       decimal = decimal >> 1

    print(ans[::-1])

binary(10)
