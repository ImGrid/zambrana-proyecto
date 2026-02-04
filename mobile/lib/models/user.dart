// Modelo de usuario
class User {
  final int id;
  final String email;
  final String rol;
  final String? nombre;
  final String? createdAt;

  User({
    required this.id,
    required this.email,
    required this.rol,
    this.nombre,
    this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      email: json['email'] as String,
      rol: json['rol'] as String,
      nombre: json['nombre'] as String?,
      createdAt: json['created_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'rol': rol,
      'nombre': nombre,
      'created_at': createdAt,
    };
  }
}
