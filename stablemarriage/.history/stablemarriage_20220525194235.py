with open('input.txt') as input:
    for line in f:
        int_list = [int(i) for i in line.split()]
        print (int_list)