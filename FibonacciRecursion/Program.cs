using System;

namespace FibonacciRecursion
{
    class Program
    {
        static int Fibonacci(int number)
        {
            if (number < 2)
            {
                return number;
            }
            else
            {
                return Fibonacci(number - 1) + Fibonacci(number - 2);
            }
        }

        static void Main()
        {
            for (int i = 0; i < 20; i++)
            {
                int fibonacci = Fibonacci(i);
                Console.Write($"{fibonacci}, ");
            }

            // Delay
            Console.ReadKey();
        }
    }
}
