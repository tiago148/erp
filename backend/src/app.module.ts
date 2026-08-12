import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { MaterialsModule } from './materials/materials.module';
import { LaborRolesModule } from './labor-roles/labor-roles.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BudgetsModule } from './budgets/budgets.module';
import { WorkSitesModule } from './work-sites/work-sites.module';
import { ProjectsModule } from './projects/projects.module';
import { ToolsModule } from './tools/tools.module';
import { StockModule } from './stock/stock.module';
import { WorkLogsModule } from './work-logs/work-logs.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { SettingsModule } from './settings/settings.module';
import { EmployeesModule } from './employees/employees.module';
import { EppModule } from './epp/epp.module';
import { DdsModule } from './dds/dds.module';
import { TrainingsModule } from './trainings/trainings.module';
import { TasksModule } from './tasks/tasks.module';
import { CalendarEventsModule } from './calendar-events/calendar-events.module';
import { SearchModule } from './search/search.module';
import { FinanceCategoriesModule } from './finance-categories/finance-categories.module';
import { FinanceEntriesModule } from './finance-entries/finance-entries.module';
import { ProjectBillingModule } from './project-billing/project-billing.module';
import { FinanceImportModule } from './finance-import/finance-import.module';
import { VehicleTripsModule } from './vehicle-trips/vehicle-trips.module';
import { VehicleMaintenancesModule } from './vehicle-maintenances/vehicle-maintenances.module';
import { MaterialSurplusModule } from './material-surplus/material-surplus.module';
import { QuotationsModule } from './quotations/quotations.module';
import { ToolMaintenancesModule } from './tool-maintenances/tool-maintenances.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    MaterialsModule,
    LaborRolesModule,
    VehiclesModule,
    BudgetsModule,
    WorkSitesModule,
    ProjectsModule,
    ToolsModule,
    StockModule,
    WorkLogsModule,
    SuppliersModule,
    PurchaseOrdersModule,
    SettingsModule,
    EmployeesModule,
    EppModule,
    DdsModule,
    TrainingsModule,
    TasksModule,
    CalendarEventsModule,
    SearchModule,
    FinanceCategoriesModule,
    FinanceEntriesModule,
    ProjectBillingModule,
    FinanceImportModule,
    VehicleTripsModule,
    VehicleMaintenancesModule,
    MaterialSurplusModule,
    QuotationsModule,
    ToolMaintenancesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}