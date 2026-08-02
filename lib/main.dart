import 'package:flutter/material.dart';
void main()=>runApp(const MyApp());
class MyApp extends StatelessWidget{
  const MyApp({super.key});
  @override Widget build(BuildContext c)=>MaterialApp(
    title: 'تطبيق إدارة',
    theme: ThemeData(colorSchemeSeed: Colors.deepPurple, useMaterial3: true),
    home: Home(),
  );
}
class Home extends StatefulWidget{
  const Home({super.key});
  @override State<Home> createState()=>_HomeState();
}
class _HomeState extends State<Home>{
  int idx=0;
  @override Widget build(BuildContext c){
    final titles=["customers","inventory","invoices","debts","payments","reports","suppliers","sales"];
    final pages=[
      Center(child: Text('تطبيق إدارة', style: TextStyle(fontSize:24, fontWeight: FontWeight.bold))),
      Center(child: Text('customers')),
      Center(child: Text('inventory')),
      Center(child: Text('invoices')),
      Center(child: Text('debts')),
      Center(child: Text('payments')),
      Center(child: Text('reports')),
      Center(child: Text('suppliers')),
      Center(child: Text('sales'))
    ];
    return Scaffold(
      appBar: AppBar(title: Text(idx==0?'تطبيق إدارة':titles[idx-1])),
      body: pages[idx],
      bottomNavigationBar: NavigationBar(
        selectedIndex: idx,
        onDestinationSelected: (i)=>setState(()=>idx=i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home), label: 'الرئيسية'),
          NavigationDestination(icon: Icon(Icons.folder), label: 'customers'),
          NavigationDestination(icon: Icon(Icons.folder), label: 'inventory'),
          NavigationDestination(icon: Icon(Icons.folder), label: 'invoices'),
          NavigationDestination(icon: Icon(Icons.folder), label: 'debts'),
          NavigationDestination(icon: Icon(Icons.folder), label: 'payments'),
          NavigationDestination(icon: Icon(Icons.folder), label: 'reports'),
          NavigationDestination(icon: Icon(Icons.folder), label: 'suppliers'),
          NavigationDestination(icon: Icon(Icons.folder), label: 'sales')
        ],
      ),
    );
  }
}
