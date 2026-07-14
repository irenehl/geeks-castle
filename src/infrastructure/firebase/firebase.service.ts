import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  App,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app!: App;
  private firestore!: Firestore;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.initializeFirebase();
  }

  getDb(): Firestore {
    return this.firestore;
  }

  private initializeFirebase(): void {
    if (getApps().length > 0) {
      this.app = getApps()[0]!;
      this.firestore = getFirestore(this.app);
      return;
    }

    const projectId =
      this.configService.get<string>('FIREBASE_PROJECT_ID') ??
      'demo-geeks-users';
    const useEmulator =
      this.configService.get<string>('FIREBASE_USE_EMULATOR') === 'true';
    const emulatorHost =
      this.configService.get<string>('FIRESTORE_EMULATOR_HOST') ??
      '127.0.0.1:8080';

    if (useEmulator) {
      process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
      this.app = initializeApp({ projectId });
      this.logger.log(
        `Firebase initialized against Firestore emulator at ${emulatorHost}`,
      );
    } else {
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');

      if (clientEmail && privateKey) {
        this.app = initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.logger.log(
          'Firebase initialized with service account credentials',
        );
      } else {
        this.app = initializeApp({ projectId });
        this.logger.warn(
          'Firebase initialized without credentials (set FIREBASE_* env vars for production)',
        );
      }
    }

    this.firestore = getFirestore(this.app);
  }
}
