import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { MaterialsModule } from './materials/materials.module';
import { LaborRolesModule } from './labor-roles/labor-roles.module';
import { ThirdPartyServicesModule } from './third-party-services/third-party-services.module';
import { RentalEquipmentModule } from './rental-equipment/rental-equipment.module';
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
import { FixedExpensesModule } from './fixed-expenses/fixed-expenses.module';
import { CostCompositionsModule } from './cost-compositions/cost-compositions.module';
import { AuditModule } from './audit/audit.module';
import { DocumentsModule } from './documents/documents.module';
import { ProjectPhasesModule } from './project-phases/project-phases.module';
import { MaterialQuotesModule } from './material-quotes/material-quotes.module';
import { AssetsModule } from './assets/assets.module';
import { PriceAdjustmentsModule } from './price-adjustments/price-adjustments.module';
import { ClientContactsModule } from './client-contacts/client-contacts.module';
import { MaintenancePlansModule } from './maintenance-plans/maintenance-plans.module';
import { StorageModule } from './storage/storage.module';
import { FinanceAttachmentsModule } from './finance-attachments/finance-attachments.module';
import { ScrapSalesModule } from './scrap-sales/scrap-sales.module';
import { PlaybooksModule } from './playbooks/playbooks.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { LessonsLearnedModule } from './lessons-learned/lessons-learned.module';
import { FinanceAccountsModule } from './finance-accounts/finance-accounts.module';
import { FinanceClosuresModule } from './finance-closures/finance-closures.module';
import { PrevistoRealizadoModule } from './previsto-realizado/previsto-realizado.module';
import { ProjectFinancialAnalysisModule } from './project-financial-analysis/project-financial-analysis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        // Limite geral: 100 requisicoes por minuto por IP. Endpoints
        // sensiveis (login) usam um limite proprio, mais restrito, via
        // @Throttle no controller.
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    ClientsModule,
    MaterialsModule,
    LaborRolesModule,
    ThirdPartyServicesModule,
    RentalEquipmentModule,
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
    FixedExpensesModule,
    CostCompositionsModule,
    DocumentsModule,
    ProjectPhasesModule,
    MaterialQuotesModule,
    AssetsModule,
    PriceAdjustmentsModule,
    ClientContactsModule,
    MaintenancePlansModule,
    StorageModule,
    FinanceAttachmentsModule,
    ScrapSalesModule,
    PlaybooksModule,
    ChecklistsModule,
    LessonsLearnedModule,
    FinanceAccountsModule,
    FinanceClosuresModule,
    PrevistoRealizadoModule,
    ProjectFinancialAnalysisModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
