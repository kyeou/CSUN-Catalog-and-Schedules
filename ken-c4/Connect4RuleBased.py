# creates copy of the board to manipulate
class boardCopy():

    global boardCopy
    global lastMove
    
    

    def __init__(self, Board):
        boardCopy = Board
        print(boardCopy)
        # For Diagonals:
        #       Take the position of that player move.
        #       The player move spot is R, C
        #       If there is a player move in R + 1, C + 1 and R + 2, C + 2
        #           That means Player can win at R - 1, C - 1
        #           IF R, C - 1 == ' ', AI point system thing = -50                        

        



#------------------------------------------------------------------------
# @SpencerLepine - Connect Four command-line game made w/ Python
# Hard-coded board size
BOARD_COLS = 7
BOARD_ROWS = 6

#We added this
#Turn variable
turn = 0
#last move variable
lastMove = 0

#board variable
#Initialize board
board = [[' ' for _ in range(BOARD_COLS)] for _ in range(BOARD_ROWS)]
#End we added this

# Game board object
class Board():
    global board
    global lastMove
    def __init__(self):
        #2D array that represents the board
        #board = [[' ' for _ in range(BOARD_COLS)] for _ in range(BOARD_ROWS)]
        self.turns = 0
        lastMove = [-1, -1] # [r, c]

    def print_board(self):
        print("\n")
        # Number the columns seperately to keep it cleaner
        for r in range(BOARD_COLS):
            print(f"  ({r+1}) ", end="")
        print("\n")

        # Print the slots of the game board
        for r in range(BOARD_ROWS):
            print('|', end="")
            for c in range(BOARD_COLS):
                print(f"  {board[r][c]}  |", end="")
            print("\n")

        print(f"{'-' * 42}\n")

    def which_turn(self):
        players = ['X', 'O']
        return players[self.turns % 2]
    
    def in_bounds(self, r, c):
        return (r >= 0 and r < BOARD_ROWS and c >= 0 and c < BOARD_COLS)

    def turn(self, column):
        print("-----------------------------------------------------------------")
        COPY = boardCopy(board)
        print("-----------------------------------------------------------------")
        global lastMove
        # Search bottom up for an open slot
        for i in range(BOARD_ROWS-1, -1, -1):
            if board[i][column] == ' ':
                board[i][column] = self.which_turn()
                lastMove = [i, column]
                #prints last move
                print("Last move:",lastMove)

                self.turns += 1
                return True
        return False


    def check_winner(self):
        last_row = lastMove[0]
        last_col = lastMove[1]
        last_letter = board[last_row][last_col]

        # [r, c] direction, matching letter count, locked bool
        directions = [[[-1, 0], 0, True], 
                      [[1, 0], 0, True], 
                      [[0, -1], 0, True],
                      [[0, 1], 0, True],
                      [[-1, -1], 0, True],
                      [[1, 1], 0, True],
                      [[-1, 1], 0, True],
                      [[1, -1], 0, True]]
        
        # Search outwards looking for matching pieces
        for a in range(4):
            for d in directions:
                r = last_row + (d[0][0] * (a+1))
                c = last_col + (d[0][1] * (a+1))

                if d[2] and self.in_bounds(r, c) and board[r][c] == last_letter:
                    d[1] += 1
                else:
                    # Stop searching in this direction
                    d[2] = False

        # Check possible direction pairs for '4 pieces in a row'
        for i in range(0, 7, 2):
            if (directions[i][1] + directions[i+1][1] >= 3):
                self.print_board()
                #Original winner print code but replaced with User or AI winning
                #print(f"{last_letter} is the winner!")

                #We added this
                #Prints is the User won of if the ai won
                if last_letter == "X":
                    print("You Won!!")
                else:
                    print("The AI Won!")
                return last_letter   
                #End we added this
        # Did not find any winners
        return False

##########################################################################################
#Start AI class
class AI():
    #qTable variable
    qTable = [None]*BOARD_COLS

    #Points system
    AIPointsTable = {0: 0, 1: 1.15, 2: 2.15, 3: 100}
    humanPointsTable = {0: 0, 1: 1, 2: 2.1, 3: 20}

###################################################
    #Updates the Q table by calculating the points for all of the possible state spaces
    #Programmer: Jaime Torrico
    def updateQ():
        #Calculated points for every column
        for c in range(BOARD_COLS):
            #Finds first open slot in each row and calculates points accordingly
            AI.findTopOpen(c)
        #prints the qTable
        print(AI.qTable) 

###################################################
    #Finds the first open stop in each columns where a piece would fall and fills and calculates its points
    #Programmer: Jaime Torrico
    def findTopOpen(column):
        #initialies value of zero to disregard any outdated valued that could possibly be saved
        AI.qTable[column] = 0

        #checks to see if a column is already full, if it puts a very large negative number in the table to prevent the AI from choosing 
        #a column that is already full
        if board[0][column] != ' ':
            AI.qTable[column] = -100
            return

    #If the bottom row is empty it will pass down the bottom row
        if board[5][column] == ' ':
            #Calls method to tally points passing down the according row and column as paramaters
            AI.tallyPoints(5, column)
            return

        #If the bottom row is not empty it will search through all of the rows in the column untill it finds the first empty row
            #It does this by finding the first occupied row and subtracing 1 from it, therefore returning where the new piece would fall due to gravity
        for r in range(BOARD_ROWS):
            if board[r][column] != ' ':
                #Calls method to tally points passing down the according row and column as paramaters
                AI.tallyPoints(r-1, column)
                return  

################################################
    #Tallies the points for the row, and column passed down
    #Programmer: Jaime Torrico
    def tallyPoints(row, column):
        #After calling each method, the points are calculated and added to the qTable
        #Calculates points based on:

        #how many pieces there are to the left(-)
        pieces = AI.countLeftPieces(row, column)
        points = AI.returnPoints(pieces)
        AI.qTable[column] += points

        #how many pieces there are to the right(-) of open
        pieces = AI.countRightPieces(row, column)
        points = AI.returnPoints(pieces)
        AI.qTable[column] += points

        #how many pieces there are to the top left diagonal (Top \) of open
        pieces = AI.countLeftUpDiagonalPieces(row, column)
        points = AI.returnPoints(pieces)
        AI.qTable[column] += points

        #how many pieces there are to the left (Bottom \) of open
        pieces = AI.countLeftDownDiagonalPieces(row, column)
        points = AI.returnPoints(pieces)
        AI.qTable[column] += points

        #how many pieces there are to the right (Top /) of open
        pieces = AI.countTopRightDiagonalPieces(row, column)
        points = AI.returnPoints(pieces)
        AI.qTable[column] += points

        #how many pieces there are to the top (Bottom /) of open
        pieces = AI.countBottomRightDiagonal(row, column)
        points = AI.returnPoints(pieces)
        AI.qTable[column] += points

        #how many pieces are under (Bottom |) of open
        pieces = AI.countDownPieces(row, column)
        points = AI.returnPoints(pieces)
        AI.qTable[column] += points

        #points = methodName()
        # method(r,c)

################################################
#Counting directions methods
        # #Checks how many consecutive pieces of the same piece are to the left of the current open spot (-)
        #Programmer: Jaime Torrico
    def countLeftPieces(row, column):
        #The current piece to the left of the first open column
        piece = board[row][column-1]
        count = 0;
        #if there is no piece or out of bounds returns 0
        if piece == ' ':
            return 0
        #if there is a piece it counts and returns the piece
        else:
            #for some reason it counts the pieces to the left
            for i in range(column, 0, -1):
                #Increments if the piece equals the privous
                if board[row][i-1] == piece and i-1 != 7:
                    count += 1
                #breaks if the pieces are different or if there is no piece
                else:
                    break
        #Returns the pieces and the count of the pieces
        return piece, count 

################################################
    #Checks how many consecutive pieces of the same piece are to the right of the current the current open spot (-)
    #Programmer: Jaime Torrico
    def countRightPieces(row,column):
        #The current piece to the right of the first open column
        #Variable used to check if the column is out of bounds
        currColumn = column + 1
        if currColumn == 7:
            return 0
            
        piece = board[row][column + 1]
        count = 0
        #if there is no piece or out of bounds returns 0
        if piece == ' ':
            return 0
        else:
            for i in range(column, 6, 1):
                #Increments upwards from 0 by 1 step
                if board[row][i+1] == piece and i != 7: #Need to make sure that it does not go directly from 7 to 1
                    count += 1
                #breaks if the pieces are different or if there is no piece
                else:
                    break
        return piece, count
################################################
    #Checks how many pieces are to the top left diagonal of the current open spot (Top \)
    #Programmer: Jaime Torrico
    def countLeftUpDiagonalPieces(row, column):
        #If there is no left diagonal becuase it is out of bounds
        if row == 0 or column == 0:
            return 0
        #Set the piece to the current left diagonal
        piece = board[row-1][column-1]
        count = 0
        #if there is no piece or out of bounds returns 0
        if piece == ' ':
            return 0
        else:
            #start at current column
            i = column
            #inc starts at 1 and increases by one each time to go to the left diagonal
            inc = 1
            #while the column is greater than 0
            while i > 0:
                curr = board[row-inc][column-inc]
                if curr == piece:
                    count += 1
                    inc += 1
                    i -= 1
                else:
                    break
        #Returns the pieces and the count of the pieces
        return piece, count    

################################################
    #Counts bottom right diagonal pieces (Bottom \)
    #Programmer: Jaime Torrico
    def countLeftDownDiagonalPieces(row, column):
        #If there is no diagonal becuase it is out of bounds it returns 0
        if row == 5 or column == 6:
            return 0

        #Set the piece to the current bottom right diagonal
        piece = board[row+1][column+1]
        count = 0
        #if there is no piece or out of bounds returns 0
        if piece == ' ':
            return 0
        #If there is a piece
        else:
            #start at current column
            i = column
            #inc starts at 1 and increases by one each time to go to the left diagonal
            inc = 1
            #while the row and column + inc are in bound
            while row + inc < 6 and column + inc < 7:
                curr = board[row+inc][column+inc]
                #if pieces are equal it increments the count
                if curr == piece:
                    count += 1
                    inc += 1
                    i += 1
                else:
                    break
        #Returns the pieces and the count of the pieces
        return piece, count

################################################
    #Counts how many pieces are to the top right of the current open spot (Top /)
    #Programmer: Jaime Torrico
    def countTopRightDiagonalPieces(row, column):
        #If there is no right diagonal becuase it is out of bounds
        if row == 0 or column == 6:
            return 0
        #Set the piece to the current left diagonal
        piece = board[row-1][column+1]
        count = 0;
        #if there is no piece or out of bounds returns 0
        if piece == ' ':
            return 0
        
        else:
            #inc starts at 1 and increases by one each time to go to the left diagonal
            i = 1
            #while the top right diagonal is in bounds
            while row-i > 0 and column+i < 6:
                curr = board[row-i][column+i]
                if curr == piece:
                    count += 1
                    i += 1
                else:
                    break
        #Returns the pieces and the count of the pieces
        return piece, count
################################################
    #Counts how many pieces are to the bottom left of the current open spot (Bottom /)
    #Programmer: Jaime Torrico
    def countBottomRightDiagonal(row, column):
        #If there is no diagonal becuase it is out of bounds
        if row == 5 or column == 0:
            return 0
        #Set the piece to the current left diagonal
        piece = board[row+1][column-1]
        count = 0
        #if there is no piece or out of bounds returns 0
        if piece == ' ':
            return 0
        
        else:
            #inc starts at 1 and increases by one each time to go to the left diagonal
            i = 1
            #while the top right diagonal is in bounds
            while row+i < 6 and column+i < 7:
                curr = board[row+i][column-i]
                if curr == piece:
                    count += 1
                    i += 1
                else:
                    break
        #Returns the pieces and the count of the pieces
        return piece, count
####################################################
    #count the pieces under the current open spot
    #Programmer: Jaime Torrico
    def countDownPieces(row, column):
        #if down is out of bounds
        if row == 5:
            return 0
        
        piece = board[row + 1][column]
        count = 0
        if piece == ' ':
            return 0
        else:
            while row < 5:
                if board[row+1][column] == piece:
                    count += 1
                    row+=1
                else:
                    break
        return piece, count
#End counting directions method
################################################

    #Method that takes the type of piece and the number of pieces and returns the according points based on the point system
    #Programmer: Jaime Torrico
    def returnPoints(pieces):
        #Pieces is (string piece, int num)
        #EX: ('X',2) or ('O',2)
        #It holds how many of what piece are passed down

        #If there are no pieces
        if pieces == 0: 
            return 0
            #Otherwise it retrieves the accordint points from the points tabel
        else:
            if pieces[0] == 'O':
                return AI.AIPointsTable[pieces[1]]
            else:
                return AI.humanPointsTable[pieces[1]] 

################################################
    #Chooses best piece based on what is in the QTable
    def AIMove():
        #Retrieves the maximum from the qTable
        maxPoints = (max(AI.qTable))
        #returns the index of the maximum from the qTable
        return AI.qTable.index(maxPoints)

#End AI class
##########################################################################################

def play():
    #We added this
    #Uses global turn variable to keep track if it is the AI's turn or the humans
    global turn
    #End we added this

    # Initialize the game board
    game = Board()
    game_over = False
    while not game_over:
        game.print_board()

        #We added this
        #AI drop token in random spot
        if  turn % 2 == 1:
            valid_move = False
            AI.updateQ()
            while not valid_move:
                ai_move = AI.AIMove()
                #print(AI.qTable)
                try:
                    #Does not subtract a 1 to make up for the index starting at 0 of the array therefore already being a -1
                    valid_move = game.turn(int(ai_move))
                    #ai_move +1 to make up for the array starting at 0 bt the board columns starting at 1
                    print("AI choose",ai_move+1)
                except:
                    print("Invalid: ", ai_move+1)
        #End we added this
                
        else:
        # Ask the user for input, but only accept valid turns
            valid_move = False
            while not valid_move:
                user_move = input(f"{game.which_turn()}'s Turn - pick a column (1-{BOARD_COLS}): ")
                try:
                    valid_move = game.turn(int(user_move)-1)
                except:
                    print(f"Please choose a number between 1 and {BOARD_COLS}")
        #Updates table 
        #We added this
        #Finish else and increment turn
        turn+=1
        #End we added this


        # End the game if there is a winner
        game_over = game.check_winner()
        
        # End the game if there is a tie
        if not any(' ' in x for x in board):
            print("The game is a draw..")
            return


if __name__ == '__main__':
    play()