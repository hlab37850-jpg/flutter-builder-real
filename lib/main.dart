import 'package:flutter/material.dart';

void main() => runApp(MahaniApp());

class MahaniApp extends StatelessWidget {
  const MahaniApp({super.key});
  @override
  Widget build(BuildContext context){
    return MaterialApp(
      title: 'تطبيقي',
      locale: Locale('ar'),
      theme: ThemeData(colorSchemeSeed: Color(0xFF8B5CF6), useMaterial3: true, fontFamily: 'Cairo'),
      home: HomeShell(),
    );
  }
}

class HomeShell extends StatefulWidget{
  const HomeShell({super.key});
  @override State<HomeShell> createState()=>_HomeShellState();
}
class _HomeShellState extends State<HomeShell>{
  int _index=0;
  final _views=[
    DashboardScreen(),
    CustomersScreen(),
    InventoryScreen(),
    SuppliersScreen(),
    InvoicesScreen(),
    DebtsScreen(),
    PaymentsScreen(),
    ReportsScreen()
  ];
  @override
  Widget build(BuildContext context){
    return Scaffold(
      body: _views[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i)=>setState(()=>_index=i),
        destinations: [
    NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'الرئيسية'),
    NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'العملاء'),
    NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'المخزون'),
    NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'الموردين'),
    NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'الفواتير'),
    NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'الديون'),
    NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'الدفعات'),
    NavigationDestination(icon: Icon(Icons.dashboard_outlined), label: 'التقارير'),
        ],
      ),
    );
  }
}

class DashboardScreen extends StatelessWidget{
  @override
  Widget build(BuildContext context){
    return Scaffold(
      appBar: AppBar(title: Text('تطبيقي'), centerTitle:true),
      body: GridView.count(
        crossAxisCount:2, padding: EdgeInsets.all(16), mainAxisSpacing:12, crossAxisSpacing:12,
        children:[
          _StatCard(title:'العملاء', value:'0', icon:'👥'),
          _StatCard(title:'المخزون', value:'0', icon:'📦'),
          _StatCard(title:'الموردين', value:'0', icon:'🚚'),
          _StatCard(title:'الفواتير', value:'0', icon:'🧾'),
          _StatCard(title:'الديون', value:'0', icon:'💳'),
          _StatCard(title:'الدفعات', value:'0', icon:'💵'),
          _StatCard(title:'التقارير', value:'0', icon:'📊')
        ]
      ),
    );
  }
}
class _StatCard extends StatelessWidget{
  final String title,value,icon;
  const _StatCard({required this.title,required this.value,required this.icon});
  @override Widget build(BuildContext context){
    return Card(child: Padding(padding: EdgeInsets.all(16), child: Column(children:[Text(icon,style:TextStyle(fontSize:24)), SizedBox(height:8), Text(title), Text(value,style:TextStyle(fontSize:22,fontWeight:FontWeight.bold))])) );
  }
}

class CustomersScreen extends StatelessWidget {
  const CustomersScreen({super.key});
  @override
  Widget build(BuildContext context){
    return Scaffold(
      appBar: AppBar(title: Text('العملاء')),
      body: Center(child: Text('العملاء - قائمة البيانات', style: TextStyle(fontSize:18))),
      floatingActionButton: FloatingActionButton(onPressed:(){}, child: Icon(Icons.add)),
    );
  }
}

class InventoryScreen extends StatelessWidget {
  const InventoryScreen({super.key});
  @override
  Widget build(BuildContext context){
    return Scaffold(
      appBar: AppBar(title: Text('المخزون')),
      body: Center(child: Text('المخزون - قائمة البيانات', style: TextStyle(fontSize:18))),
      floatingActionButton: FloatingActionButton(onPressed:(){}, child: Icon(Icons.add)),
    );
  }
}

class SuppliersScreen extends StatelessWidget {
  const SuppliersScreen({super.key});
  @override
  Widget build(BuildContext context){
    return Scaffold(
      appBar: AppBar(title: Text('الموردين')),
      body: Center(child: Text('الموردين - قائمة البيانات', style: TextStyle(fontSize:18))),
      floatingActionButton: FloatingActionButton(onPressed:(){}, child: Icon(Icons.add)),
    );
  }
}

class InvoicesScreen extends StatelessWidget {
  const InvoicesScreen({super.key});
  @override
  Widget build(BuildContext context){
    return Scaffold(
      appBar: AppBar(title: Text('الفواتير')),
      body: Center(child: Text('الفواتير - قائمة البيانات', style: TextStyle(fontSize:18))),
      floatingActionButton: FloatingActionButton(onPressed:(){}, child: Icon(Icons.add)),
    );
  }
}

class DebtsScreen extends StatelessWidget {
  const DebtsScreen({super.key});
  @override
  Widget build(BuildContext context){
    return Scaffold(
      appBar: AppBar(title: Text('الديون')),
      body: Center(child: Text('الديون - قائمة البيانات', style: TextStyle(fontSize:18))),
      floatingActionButton: FloatingActionButton(onPressed:(){}, child: Icon(Icons.add)),
    );
  }
}

class PaymentsScreen extends StatelessWidget {
  const PaymentsScreen({super.key});
  @override
  Widget build(BuildContext context){
    return Scaffold(
      appBar: AppBar(title: Text('الدفعات')),
      body: Center(child: Text('الدفعات - قائمة البيانات', style: TextStyle(fontSize:18))),
      floatingActionButton: FloatingActionButton(onPressed:(){}, child: Icon(Icons.add)),
    );
  }
}

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});
  @override
  Widget build(BuildContext context){
    return Scaffold(
      appBar: AppBar(title: Text('التقارير')),
      body: Center(child: Text('التقارير - قائمة البيانات', style: TextStyle(fontSize:18))),
      floatingActionButton: FloatingActionButton(onPressed:(){}, child: Icon(Icons.add)),
    );
  }
}
