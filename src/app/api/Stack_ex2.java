import java.util.*;
class Node{
    int data;
    Node address;
    Node(int data){
        this.data=data;
        this.address=null;
    }
}
class stack{
    Node top;
    int size=0;
    public void push(int data){
        Node new_n=new Node(data);
        new_n.address=top;
        top=new_n;
        size++;
    }
    public void pop(){
        if(top==null){
            System.out.print(-1);
            return;
        }
        int del=top.data;
        top=top.address;
        size--;
        System.out.println(del);
    }
    public void display(){
        if(top==null){
            return;
        }
        Node curr_n=top;
        while(curr_n!=null){
            System.out.println(curr_n.data);
            curr_n=curr_n.address;
        }
    }
    public void is_empty(){
        if(top==null){
            System.out.println("true");
            return;
        }
        else{
            System.out.println("false");
            return;
        }
    }
    public void length(){
        System.out.println(size);
        return;
    }
}

public class Stack_ex2
{
	public static void main(String[] args) {
		Scanner sc=new Scanner(System.in);
		stack o =new stack();
		while(true){
		    int a=sc.nextInt();
		    if(a<0){
		        break;
		    }
		    o.push(a);
		}
		o.display();
		o.pop();
		o.length();
		o.is_empty();
	}
}
