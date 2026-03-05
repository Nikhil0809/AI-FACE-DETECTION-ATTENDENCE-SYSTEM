
import java.util.*;
class stack{
        int array_stack[];
        int size;
        int capacity;
        int top;
        stack(int c){
            this.capacity=c;
            this.array_stack=new int[c];
            this.size=0;
            this.top=-1;
        }
        public void push(int data){
            if(size==capacity){
                System.out.println("stack overflow");
                return;
            }
            array_stack[++top]=data;
            size++;
        }
        public boolean is_empty(){
            if(size==0){
                return true;
            }
            else{
                return false;
            }
        }
        public boolean is_full(){
            if(size==capacity){
                return true;
            }
            else{
                return false;
            }
        }
        public void pop(){
            if(size==0){
                System.out.println("stack underflow");
                return;
            }
            int del=array_stack[top];
            top--;
            size--;
            System.out.println("deleted ele is:"+del);
        }
        public void display(){
            if(size==0){
                System.out.println("Stack is empty");
                return;
            }
            for(int i=top;i>=0;i--){
                System.out.print(array_stack[i]+" ");
            }
            System.out.println();
        }
    }
public class Stack_example{
	public static void main(String[] args) {
		Scanner sc=new Scanner(System.in);
		System.out.println("enter stack capacity");
		int c=sc.nextInt();
		stack o=new stack(c);
		while(true){
		    int a=sc.nextInt();
		    if(a<0){
		        break;
		    }
		    o.push(a);
		}
		System.out.println("data present in stack");
		o.display();
		o.pop();
		System.out.println("stack is empty:"+o.is_empty());
		System.out.println("stack is full:"+o.is_full());
		
	}
}
